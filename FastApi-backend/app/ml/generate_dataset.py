"""
TrainSense Dataset Generation Script
Wraps data_generator.py to generate and validate the unified railway operations dataset.
"""

import os
import sys

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from app.ml.data_generator import generate_railway_dataset, validate_and_save_dataset

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_file = os.path.abspath(os.path.join(script_dir, "../../data/train_operations.csv"))
    dataset_df = generate_railway_dataset(n_samples=12000)
    validate_and_save_dataset(dataset_df, output_file)
