import pandas as pd
import matplotlib.pyplot as plt
from fetch_data import fetch_latest_records
import os

def fetch_multi_coin_data(coins, limit=500, interval="2T"):
    """Fetch last N records for multiple coins and align them by timestamp."""
    dataframes = []
    for coin in coins:
        df = fetch_latest_records(coin, limit=limit)
        if df is not None:
            df = df[["timestamp", "price"]].rename(columns={"price": coin})
            df = df.set_index("timestamp")
            # Resample to common interval and forward-fill
            df = df.resample(interval).ffill()
            dataframes.append(df)
    if not dataframes:
        print("⚠️ No data fetched for given coins")
        return None
    # Outer join, then forward-fill to ensure alignment
    combined_df = pd.concat(dataframes, axis=1).ffill().dropna()
    return combined_df

def calculate_correlation(df: pd.DataFrame):
    """Compute correlation matrix for the given coins."""
    return df.corr()

def plot_correlation_heatmap(corr_matrix, coins, save=True):
    """Plot correlation heatmap."""
    plt.figure(figsize=(6, 5))
    plt.imshow(corr_matrix, cmap="coolwarm", interpolation="nearest")
    plt.colorbar(label="Correlation Coefficient")
    plt.xticks(range(len(coins)), coins, rotation=45)
    plt.yticks(range(len(coins)), coins)
    plt.title("Crypto Price Correlation")
    plt.tight_layout()

    if save:
        os.makedirs("outputs", exist_ok=True)
        file_path = "outputs/coin_correlation_heatmap.png"
        plt.savefig(file_path)
        print(f"📁 Saved: {file_path}")

    plt.show()

def plot_rolling_correlation(df: pd.DataFrame, pair, window=50, save=True):
    """Plot rolling correlation between two coins."""
    coin1, coin2 = pair
    rolling_corr = df[coin1].rolling(window).corr(df[coin2])

    plt.figure(figsize=(12, 6))
    plt.plot(df.index, rolling_corr, label=f"{coin1} vs {coin2}")
    plt.title(f"Rolling Correlation ({coin1} vs {coin2}) - Window={window}")
    plt.xlabel("Time")
    plt.ylabel("Correlation")
    plt.ylim(-1, 1)
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    if save:
        os.makedirs("outputs", exist_ok=True)
        file_path = f"outputs/rolling_corr_{coin1}_{coin2}.png"
        plt.savefig(file_path)
        print(f"📁 Saved: {file_path}")

    plt.show()

if __name__ == "__main__":
    coins = ["bitcoin", "ethereum", "matic-network"]
    df = fetch_multi_coin_data(coins, limit=500)

    if df is not None:
        print("\n✅ Sample Combined Data:")
        print(df.head())

        # Static correlation
        corr_matrix = calculate_correlation(df)
        print("\n📊 Correlation Matrix:")
        print(corr_matrix)
        plot_correlation_heatmap(corr_matrix, coins)

        # Rolling correlation plots
        pairs = [("bitcoin", "ethereum"), ("bitcoin", "matic-network"), ("ethereum", "matic-network")]
        for pair in pairs:
            plot_rolling_correlation(df, pair, window=50)
