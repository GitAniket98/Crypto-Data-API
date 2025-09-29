import os
import matplotlib.pyplot as plt
from fetch_data import fetch_latest_records
import pandas as pd

# -------------------------
# Analytics Functions
# -------------------------
def calculate_moving_averages(df: pd.DataFrame, short_window=10, long_window=50):
    """Add short and long SMA to DataFrame."""
    df["SMA_short"] = df["price"].rolling(window=short_window).mean()
    df["SMA_long"] = df["price"].rolling(window=long_window).mean()
    return df

def calculate_volatility(df: pd.DataFrame, window=20):
    """Add rolling volatility (std dev) to DataFrame."""
    df["Volatility"] = df["price"].rolling(window=window).std()
    return df

# -------------------------
# Visualization Functions
# -------------------------
def plot_price_with_sma(df, coin, save=True):
    """Plot price with short and long SMA."""
    plt.figure(figsize=(12, 6))
    plt.plot(df["timestamp"], df["price"], label="Price", color="blue")
    plt.plot(df["timestamp"], df["SMA_short"], label="SMA Short", color="orange")
    plt.plot(df["timestamp"], df["SMA_long"], label="SMA Long", color="red")
    plt.title(f"{coin.capitalize()} Price with Moving Averages")
    plt.xlabel("Time")
    plt.ylabel("Price (USD)")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    if save:
        os.makedirs("outputs", exist_ok=True)
        file_path = f"outputs/{coin}_price_sma.png"
        plt.savefig(file_path)
        print(f"📁 Saved: {file_path}")

    plt.show()

def plot_volatility(df, coin, save=True):
    """Plot rolling volatility."""
    plt.figure(figsize=(12, 6))
    plt.plot(df["timestamp"], df["Volatility"], label="Volatility (Std Dev)", color="purple")
    plt.title(f"{coin.capitalize()} Volatility")
    plt.xlabel("Time")
    plt.ylabel("Volatility")
    plt.legend()
    plt.grid(True)
    plt.tight_layout()

    if save:
        os.makedirs("outputs", exist_ok=True)
        file_path = f"outputs/{coin}_volatility.png"
        plt.savefig(file_path)
        print(f"📁 Saved: {file_path}")

    plt.show()

# -------------------------
# Main Script
# -------------------------
if __name__ == "__main__":
    coins = ["bitcoin", "ethereum", "matic-network"]

    for coin in coins:
        df = fetch_latest_records(coin, limit=1000)
        if df is not None:
            df = calculate_moving_averages(df)
            df = calculate_volatility(df)

            print(f"\n✅ Analysis Results for {coin.capitalize()} (last 5 rows):")
            print(df.tail())

            # --- Plots ---
            plot_price_with_sma(df, coin)
            plot_volatility(df, coin)
        else:
            print(f"⚠️ No data found for {coin}")