import os
import numpy as np
import pandas as pd

# Set fixed random seed for reproducibility
SEED = 42
np.random.seed(SEED)


def generate_railway_dataset(n_samples: int = 10000) -> pd.DataFrame:
    """
    Generates synthetic railway operational dataset with realistic physics,
    traffic, signaling, and weather relationships for ML conflict prediction.
    """
    # 1. Categorical / Identifier generation
    train_ids = [f"TRN-{np.random.randint(100, 999)}" for _ in range(n_samples)]
    train_types = np.random.choice(
        ["HIGH_SPEED", "EXPRESS", "PASSENGER", "FREIGHT"],
        size=n_samples,
        p=[0.2, 0.4, 0.25, 0.15]
    )
    sections = [f"SEC-{chr(65 + np.random.randint(0, 8))}{np.random.randint(1, 10)}" for _ in range(n_samples)]

    # Scheduled times across a 24-hour operational window
    base_timestamps = pd.date_range(start="2026-08-01 00:00:00", periods=n_samples, freq="86s")
    scheduled_times = [ts.strftime("%Y-%m-%dT%H:%M:%SZ") for ts in base_timestamps]

    # 2. Continuous Operational Features
    # Previous station delay (exponential distribution + base)
    previous_station_delay_min = np.round(np.random.exponential(scale=5.0, size=n_samples), 1)

    # Current delay correlated with previous station delay + noise
    current_delay_min = np.round(
        previous_station_delay_min * np.random.uniform(0.8, 1.3, size=n_samples) +
        np.random.exponential(scale=3.0, size=n_samples),
        1
    )

    # Train speeds based on train_type
    speed_map = {
        "HIGH_SPEED": (120, 160),
        "EXPRESS": (80, 120),
        "PASSENGER": (50, 90),
        "FREIGHT": (30, 75)
    }
    speed_kmh = np.array([
        np.round(np.random.uniform(*speed_map[t]), 1) for t in train_types
    ])

    # Environmental & System Conditions
    weather_conditions = np.random.choice(
        ["CLEAR", "RAIN", "FOG", "STORM"],
        size=n_samples,
        p=[0.60, 0.25, 0.10, 0.05]
    )

    traffic_density = np.round(np.random.uniform(0.1, 1.0, size=n_samples), 2)

    # Headway: higher traffic density leads to smaller headway
    headway_min = np.round(
        np.clip(30.0 * (1.0 - 0.7 * traffic_density) + np.random.normal(0, 2.0, size=n_samples), 1.0, 45.0),
        1
    )

    # Distance to potential conflict zone (km)
    distance_to_conflict_km = np.round(
        np.random.exponential(scale=12.0, size=n_samples) + 0.5,
        2
    )

    # Section occupancy (binary 0 or 1)
    # Higher traffic density & smaller headway increase occupancy likelihood
    occ_prob = 1 / (1 + np.exp(-(3.0 * traffic_density - 0.1 * headway_min - 1.0)))
    section_occupied = (np.random.rand(n_samples) < occ_prob).astype(int)

    # Signal status
    signal_options = ["GREEN", "DOUBLE_YELLOW", "YELLOW", "RED"]
    signal_statuses = []
    for occ, dist in zip(section_occupied, distance_to_conflict_km):
        if occ == 1 or dist < 2.0:
            probs = [0.05, 0.20, 0.35, 0.40]
        elif dist < 5.0:
            probs = [0.20, 0.40, 0.30, 0.10]
        else:
            probs = [0.70, 0.20, 0.08, 0.02]
        signal_statuses.append(np.random.choice(signal_options, p=probs))
    signal_status = np.array(signal_statuses)

    # 3. Model Physics & Logic for Conflict Probability Calculation
    signal_score_map = {"GREEN": 0.0, "DOUBLE_YELLOW": 0.35, "YELLOW": 0.75, "RED": 1.25}
    signal_scores = np.array([signal_score_map[s] for s in signal_status])

    weather_score_map = {"CLEAR": 0.0, "RAIN": 0.2, "FOG": 0.4, "STORM": 0.7}
    weather_scores = np.array([weather_score_map[w] for w in weather_conditions])

    # Interactions: High speed with small headway or small distance to conflict increases risk
    speed_distance_interaction = (speed_kmh / 100.0) / (distance_to_conflict_km + 0.5)
    speed_headway_interaction = (speed_kmh / 100.0) / (headway_min + 0.5)

    # Logit Z calculation
    z = (
        -3.5 +                                                   # Intercept
        0.04 * current_delay_min +                               # Higher delay
        0.02 * previous_station_delay_min +                      # Prev delay
        1.8 * (1.0 / (headway_min + 1.0)) +                      # Small headway
        2.2 * section_occupied +                                 # Section occupied
        2.5 * (1.0 / (distance_to_conflict_km + 0.5)) +          # Close conflict distance
        1.5 * traffic_density +                                  # Traffic density
        1.6 * signal_scores +                                    # Signal status
        0.4 * weather_scores +                                   # Weather
        0.6 * speed_distance_interaction +                       # Speed-distance interaction
        0.4 * speed_headway_interaction +                        # Speed-headway interaction
        np.random.normal(0, 0.35, size=n_samples)                # Noise
    )

    # Sigmoid function for conflict probability
    conflict_probability = 1 / (1 + np.exp(-z))
    conflict_probability = np.round(np.clip(conflict_probability, 0.001, 0.999), 4)

    # Binary conflict target derived with controlled randomness
    conflict = (np.random.rand(n_samples) < conflict_probability).astype(int)

    # Construct DataFrame
    df = pd.DataFrame({
        "train_id": train_ids,
        "train_type": train_types,
        "section_id": sections,
        "scheduled_time": scheduled_times,
        "current_delay_min": current_delay_min,
        "speed_kmh": speed_kmh,
        "section_occupied": section_occupied,
        "headway_min": headway_min,
        "distance_to_conflict_km": distance_to_conflict_km,
        "weather_condition": weather_conditions,
        "signal_status": signal_status,
        "traffic_density": traffic_density,
        "previous_station_delay_min": previous_station_delay_min,
        "conflict_probability": conflict_probability,
        "conflict": conflict
    })

    return df


def validate_and_save_dataset(df: pd.DataFrame, output_path: str):
    """
    Validates dataset integrity, checks ranges, prints summary, and writes CSV.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    df.to_csv(output_path, index=False)

    print("==================================================")
    print("TrainSense Synthetic Dataset Validation Report")
    print("==================================================")
    print(f"File Saved To            : {output_path}")
    print(f"Dataset Shape            : {df.shape[0]} rows, {df.shape[1]} columns")
    print(f"Null Values Total        : {df.isnull().sum().sum()}")
    print("\nConflict Class Distribution:")
    print(df["conflict"].value_counts(normalize=True).rename({0: "No Conflict (0)", 1: "Conflict (1)"}).to_string())
    print("\nValue Ranges Check:")
    print(f"- Current Delay Min      : [{df['current_delay_min'].min()}, {df['current_delay_min'].max()}] min")
    print(f"- Speed Kmh              : [{df['speed_kmh'].min()}, {df['speed_kmh'].max()}] km/h")
    print(f"- Headway Min            : [{df['headway_min'].min()}, {df['headway_min'].max()}] min")
    print(f"- Distance to Conflict   : [{df['distance_to_conflict_km'].min()}, {df['distance_to_conflict_km'].max()}] km")
    print(f"- Conflict Probability   : [{df['conflict_probability'].min()}, {df['conflict_probability'].max()}]")
    print("\nFirst 5 Rows:")
    print(df.head().to_string())
    print("==================================================")


if __name__ == "__main__":
    output_csv = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../data/train_operations.csv"))
    dataset = generate_railway_dataset(n_samples=10000)
    validate_and_save_dataset(dataset, output_csv)
