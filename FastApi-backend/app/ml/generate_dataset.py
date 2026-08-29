import os
import numpy as np
import pandas as pd

# Set fixed random seed for reproducibility
SEED = 42
np.random.seed(SEED)


def generate_train_operations_dataset(n_samples: int = 10000) -> pd.DataFrame:
    """
    Generates synthetic historical railway operational records adhering to Steps 25-27
    of the TrainSense build specification.
    """
    # 1. Feature Generation
    # Train priority: EXPRESS (high priority), PASSENGER (medium), FREIGHT (low)
    train_priorities = np.random.choice(
        ["EXPRESS", "PASSENGER", "FREIGHT"],
        size=n_samples,
        p=[0.4, 0.4, 0.2]
    )

    # Train speed (km/h) based on priority
    speed_ranges = {
        "EXPRESS": (90.0, 160.0),
        "PASSENGER": (60.0, 110.0),
        "FREIGHT": (30.0, 75.0)
    }
    train_speed = np.array([
        np.round(np.random.uniform(*speed_ranges[p]), 1) for p in train_priorities
    ])

    # Previous delay (min)
    previous_delay = np.round(np.random.exponential(scale=4.5, size=n_samples), 1)

    # Current delay (min) - strongly correlated with previous delay + random deviation
    current_delay = np.round(
        np.maximum(0.0, previous_delay * np.random.uniform(0.7, 1.3, size=n_samples) + np.random.exponential(scale=3.0, size=n_samples)),
        1
    )

    # Headway (min) - time buffer to train ahead
    headway = np.round(np.random.uniform(1.5, 30.0, size=n_samples), 1)

    # Section occupancy (0: Clear, 1: Occupied)
    # Smaller headway increases section occupancy probability
    occ_prob = 1 / (1 + np.exp(-(3.5 - 0.25 * headway)))
    section_occupancy = (np.random.rand(n_samples) < occ_prob).astype(int)

    # Distance to next station (km)
    distance_to_next_station = np.round(np.random.uniform(0.5, 40.0, size=n_samples), 2)

    # Time of day (0.00 to 23.99 hours)
    time_of_day = np.round(np.random.uniform(0.0, 24.0, size=n_samples), 2)

    # Weather conditions
    weather_conditions = np.random.choice(
        ["CLEAR", "RAIN", "FOG", "STORM"],
        size=n_samples,
        p=[0.60, 0.25, 0.10, 0.05]
    )

    # 2. Target Variable Computations (Step 26 & Step 27 logic)
    weather_impact_map = {"CLEAR": 0.0, "RAIN": 1.5, "FOG": 3.0, "STORM": 5.5}
    weather_delay_impact = np.array([weather_impact_map[w] for w in weather_conditions])

    # Predicted Delay (min)
    # Lower speed, higher current/previous delay, section occupancy, and adverse weather increase predicted delay
    predicted_delay = np.round(
        np.maximum(
            0.0,
            current_delay * 0.85 +
            previous_delay * 0.20 +
            (120.0 - train_speed) * 0.08 +
            section_occupancy * 4.5 +
            (10.0 / (headway + 0.5)) +
            weather_delay_impact +
            np.random.normal(0.0, 2.0, size=n_samples)
        ),
        1
    )

    # Conflict Probability Z-Score (Logit)
    weather_score_map = {"CLEAR": 0.0, "RAIN": 0.25, "FOG": 0.55, "STORM": 0.95}
    weather_scores = np.array([weather_score_map[w] for w in weather_conditions])

    z = (
        -3.2 +
        0.05 * current_delay +
        0.03 * previous_delay +
        2.2 * section_occupancy +
        2.5 * (1.0 / (headway + 0.5)) +
        2.8 * (1.0 / (distance_to_next_station + 0.5)) +
        0.6 * weather_scores +
        (100.0 / (train_speed + 10.0)) * 0.4 +
        np.random.normal(0.0, 0.35, size=n_samples)
    )

    # Sigmoid function bound between 0 and 1
    conflict_probability = 1.0 / (1.0 + np.exp(-z))
    conflict_probability = np.round(np.clip(conflict_probability, 0.001, 0.999), 4)

    # Binary Conflict target derived from probability with controlled randomness
    conflict = (np.random.rand(n_samples) < conflict_probability).astype(int)

    # Construct Pandas DataFrame
    df = pd.DataFrame({
        "train_speed": train_speed,
        "current_delay": current_delay,
        "previous_delay": previous_delay,
        "section_occupancy": section_occupancy,
        "headway": headway,
        "train_priority": train_priorities,
        "distance_to_next_station": distance_to_next_station,
        "time_of_day": time_of_day,
        "weather_condition": weather_conditions,
        "predicted_delay": predicted_delay,
        "conflict_probability": conflict_probability,
        "conflict": conflict
    })

    return df


def validate_and_export_dataset(df: pd.DataFrame, output_path: str):
    """
    Validates rules from Step 27 and outputs dataset to CSV.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print("==================================================")
    print("TrainSense Steps 25-27 Dataset Generation & Validation")
    print("==================================================")
    print(f"Dataset Output File       : {output_path}")
    print(f"Total Rows & Columns      : {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Null Values Count         : {df.isnull().sum().sum()}")
    
    # 1. Row count check
    assert abs(df.shape[0] - 10000) <= 100, f"Expected approx 10000 rows, got {df.shape[0]}"
    
    # 2. Null value check
    assert df.isnull().sum().sum() == 0, "Dataset contains null values!"
    
    # 3. Probability range check
    assert df["conflict_probability"].min() >= 0.0 and df["conflict_probability"].max() <= 1.0, "Conflict probability out of range [0, 1]"
    
    # 4. Class distribution check
    conflict_counts = df["conflict"].value_counts(normalize=True).to_dict()
    assert 0 in conflict_counts and 1 in conflict_counts, "Conflict binary target must contain both classes!"
    
    print("\nConflict Class Distribution:")
    for cls, pct in conflict_counts.items():
        print(f"  Class {cls}: {pct * 100:.2f}%")

    print("\nBasic Descriptive Statistics:")
    print(df.describe().to_string())

    print("\nFirst 5 Rows:")
    print(df.head().to_string())

    print("\n[VALIDATION RESULT]: PASSED ALL CHECKS SUCCESSFULLY!")
    print("==================================================")


if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.abspath(os.path.join(script_dir, "../../data/train_operations.csv"))
    dataset_df = generate_train_operations_dataset(n_samples=10000)
    validate_and_export_dataset(dataset_df, output_file)
