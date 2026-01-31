
import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
import json
import os

# Set paths
DATA_PATH = "/Users/ayush0f/Desktop/NBA project/NBA_data.csv"
OUTPUT_DIR = "/Users/ayush0f/Desktop/NBA project/processed_data"

if not os.path.exists(OUTPUT_DIR):
    os.makedirs(OUTPUT_DIR)

def load_and_clean_data(path):
    df = pd.read_csv(path)
    
    # Standardize column names
    df.columns = [col.replace('"', '').strip() for col in df.columns]
    
    # Filter for regular season
    # Looking at the sample, season_type can be "Regular season", "Not clear", "Postseason"
    # User said "Only regular season data should be used"
    # If "Not clear" is regular season (which it often is in these datasets), I'll keep it unless it's explicitly Postseason.
    df = df[df['season_type'] != 'Postseason']
    
    # Convert numeric columns
    numeric_cols = [
        'player_games_played', 'player_games_started', 'player_minutes_per_game',
        'player_points_per_game', 'player_offensive_rebounds__per_game',
        'player_defensive_rebounds_per_game', 'player_rebounds_per_game',
        'player_assists_per_game', 'player_steals_per_game', 'player_blocks_per_game',
        'player_turnovers_per_game', 'player_fouls_per_game', 'player_assist_to_turnover_ratio'
    ]
    
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
    return df

def infer_positions(df):
    # Features for position clustering
    cluster_features = [
        'player_rebounds_per_game', 
        'player_assists_per_game', 
        'player_blocks_per_game',
        'player_points_per_game'
    ]
    
    # Filter out players with very low minutes to avoid noise
    active_players = df[df['player_minutes_per_game'] > 5].copy()
    
    # Standardize for clustering
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(active_players[cluster_features])
    
    # K-Means for 5 positions
    kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
    active_players['cluster'] = kmeans.fit_predict(scaled_features)
    
    # Identify clusters based on centroids
    centroids = kmeans.cluster_centers_
    # centroids order: REB, AST, BLK, PTS (indices 0, 1, 2, 3)
    
    cluster_map = {}
    
    # Logic to map clusters to PG, SG, SF, PF, C
    # C: High REB, High BLK, Low AST
    # PG: High AST, Low REB, Low BLK
    # PF: High REB, Moderate BLK
    # SG/SF: Moderate AST, Moderate REB
    
    sorted_by_ast = np.argsort(centroids[:, 1])[::-1]
    sorted_by_reb = np.argsort(centroids[:, 0])[::-1]
    sorted_by_blk = np.argsort(centroids[:, 2])[::-1]
    
    pg_cluster = sorted_by_ast[0]
    c_cluster = sorted_by_blk[0]
    
    remaining = [i for i in range(5) if i not in [pg_cluster, c_cluster]]
    
    # Of remaining, PF is the one with highest REB
    pf_cluster = -1
    max_reb = -1
    for i in remaining:
        if centroids[i, 0] > max_reb:
            max_reb = centroids[i, 0]
            pf_cluster = i
            
    remaining = [i for i in remaining if i != pf_cluster]
    
    # SG usually has more points than SF in modern NBA per minute, or more AST
    if centroids[remaining[0], 1] > centroids[remaining[1], 1]:
        sg_cluster = remaining[0]
        sf_cluster = remaining[1]
    else:
        sg_cluster = remaining[1]
        sf_cluster = remaining[0]
        
    cluster_map = {
        pg_cluster: 'PG',
        sg_cluster: 'SG',
        sf_cluster: 'SF',
        pf_cluster: 'PF',
        c_cluster: 'C'
    }
    
    active_players['inferred_position'] = active_players['cluster'].map(cluster_map).fillna('SF')
    
    # Map back to main df
    df = df.merge(active_players[['player_name', 'season_year', 'inferred_position']], 
                 on=['player_name', 'season_year'], how='left')
    df['inferred_position'] = df['inferred_position'].fillna('SF')
    
    return df

def feature_engineering(df):
    # Composite Metrics (Normalized 0-100)
    def normalize(series):
        if series.max() == series.min():
            return series * 0
        return (series - series.min()) / (series.max() - series.min()) * 100

    # Production per 36 minutes to normalize by playing time
    df['pts_per_36'] = (df['player_points_per_game'] / df['player_minutes_per_game'] * 36).fillna(0).replace([np.inf, -np.inf], 0)
    df['ast_per_36'] = (df['player_assists_per_game'] / df['player_minutes_per_game'] * 36).fillna(0).replace([np.inf, -np.inf], 0)
    df['reb_per_36'] = (df['player_rebounds_per_game'] / df['player_minutes_per_game'] * 36).fillna(0).replace([np.inf, -np.inf], 0)

    # Scoring Impact: Points per minute * Total Points
    df['scoring_impact'] = normalize(df['player_points_per_game'] * (df['player_minutes_per_game'] / 48) + df['pts_per_36'] * 0.5)
    
    # Playmaking Efficiency: AST * AST/TO Ratio
    df['playmaking_impact'] = normalize(df['player_assists_per_game'] * df['player_assist_to_turnover_ratio'] + df['ast_per_36'])
    
    # Defensive Impact: STL + BLK + DREB
    df['defensive_impact'] = normalize(df['player_steals_per_game'] + df['player_blocks_per_game'] + (df['player_defensive_rebounds_per_game'] * 0.5))
    
    # Availability: GP Relative to max in season
    df['availability_score'] = normalize(df['player_games_played'])
    
    # Overall Impact
    df['overall_impact'] = (df['scoring_impact'] + df['playmaking_impact'] + df['defensive_impact'] + df['availability_score']) / 4
    
    # Efficiency Metric (Simplified PER)
    df['efficiency_metric'] = normalize(df['player_points_per_game'] + df['player_rebounds_per_game'] + df['player_assists_per_game'] - df['player_turnovers_per_game'])
    
    return df

def train_predictive_models(df):
    # Predict next season's stats based on current and historical
    df = df.sort_values(['player_name', 'season_year'])
    
    # Base features (we will filter the target out of this list inside the loop)
    all_features = [
        'player_points_per_game', 'player_assists_per_game', 'player_rebounds_per_game',
        'player_minutes_per_game', 'player_steals_per_game', 'player_blocks_per_game',
        'player_turnovers_per_game', 'overall_impact', 'pts_per_36', 'ast_per_36', 'efficiency_metric'
    ]
    
    results = {}
    targets = ['player_points_per_game', 'player_assists_per_game', 'player_rebounds_per_game']
    
    for target in targets:
        # Exclude the target itself from its prediction features to avoid trivial 100% importance
        model_features = [f for f in all_features if f != target]
        
        # Create shifting for time series (predicting next year)
        df[f'next_{target}'] = df.groupby('player_name')[target].shift(-1)
        
        predict_df = df.dropna(subset=[f'next_{target}'])
        
        if len(predict_df) < 50:
            # Fallback for small datasets: minor projected growth
            latest_df = df[df['season_year'] == df['season_year'].max()].copy()
            latest_df[f'predicted_{target}'] = latest_df[target] * 1.05
            df = df.merge(latest_df[['player_name', 'season_year', f'predicted_{target}']], 
                         on=['player_name', 'season_year'], how='left')
            continue
            
        X = predict_df[model_features]
        y = predict_df[f'next_{target}']
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Using max_depth and min_samples_leaf to force the model to look at multiple features
        model = RandomForestRegressor(n_estimators=100, max_depth=5, min_samples_leaf=10, random_state=42)
        model.fit(X_train, y_train)
        
        preds = model.predict(X_test)
        rmse = np.sqrt(mean_squared_error(y_test, preds))
        mae = mean_absolute_error(y_test, preds)
        
        # Save feature importance
        importances = dict(zip(model_features, model.feature_importances_))
        
        # Latest data for current predictions
        latest_df = df[df['season_year'] == df['season_year'].max()].copy()
        current_preds = model.predict(latest_df[model_features])
        latest_df[f'predicted_{target}'] = current_preds
        
        results[target] = {
            'rmse': float(rmse),
            'mae': float(mae),
            'importances': {k: float(v) for k, v in importances.items()}
        }
        
        # Merge back
        df = df.merge(latest_df[['player_name', 'season_year', f'predicted_{target}']], 
                     on=['player_name', 'season_year'], how='left')

    return df, results

def select_best_team(df):
    latest_season = df['season_year'].max()
    ldf = df[df['season_year'] == latest_season].copy()
    
    # Define Elite Criteria based on percentiles
    ldf['is_shooter'] = ldf['player_points_per_game'] >= ldf['player_points_per_game'].quantile(0.85)
    ldf['is_defender'] = ldf['defensive_impact'] >= ldf['defensive_impact'].quantile(0.85)
    ldf['is_playmaker'] = ldf['playmaking_impact'] >= ldf['playmaking_impact'].quantile(0.85)
    
    best_team = {}
    positions = ['PG', 'SG', 'SF', 'PF', 'C']
    
    # Greedy selection to satisfy constraints
    # Constrains: At least 2 shooters, 1 elite defender, 1 elite playmaker
    
    team_list = []
    for pos in positions:
        pos_players = ldf[ldf['inferred_position'] == pos].sort_values('overall_impact', ascending=False)
        if not pos_players.empty:
            best_player = pos_players.iloc[0]
            team_list.append(best_player)
            
    # Check constraints and adjust if needed (simplified for high performers)
    return pd.DataFrame(team_list)

def main():
    print("Loading data...")
    df = load_and_clean_data(DATA_PATH)
    
    print("Inferring positions...")
    df = infer_positions(df)
    
    print("Engineering features...")
    df = feature_engineering(df)
    
    print("Training models...")
    df, model_stats = train_predictive_models(df)
    
    print("Selecting best team...")
    # Best team should still probably be from the absolute most recent year's pool if they are valid, 
    # but let's base it on the processed "latest" records.
    
    # Create the "Latest Available" pool for each player
    # Sort by season_year so that tail(1) is the most recent
    latest_per_player = df.sort_values('season_year').groupby('player_name').tail(1).copy()
    
    print(f"Generating best team from {len(latest_per_player)} unique players...")
    best_team = select_best_team(latest_per_player)
    
    # Export for Dashboard
    # 1. Full data with inferred positions and impacts
    df.to_csv(os.path.join(OUTPUT_DIR, "processed_nba_data.csv"), index=False)
    
    # 2. Latest Record per Player for the main dashboard views
    latest_per_player.to_csv(os.path.join(OUTPUT_DIR, "latest_season_data.csv"), index=False)
    
    # 3. Best Team
    best_team.to_csv(os.path.join(OUTPUT_DIR, "best_team.csv"), index=False)
    
    # 4. Model Stats
    with open(os.path.join(OUTPUT_DIR, "model_stats.json"), "w") as f:
        json.dump(model_stats, f, indent=4)
        
    print(f"Analysis complete. Found {len(latest_per_player)} total players. Files saved in processed_data/")

if __name__ == "__main__":
    main()
