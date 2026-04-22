import pickle
import pandas as pd
import numpy as np
from core.bias_analyzer import calculate_demographic_parity, calculate_disparate_impact, calculate_overall_fairness_score

def load_model(filepath):
    with open(filepath, 'rb') as f:
        model = pickle.load(f)
    return model

def run_model_bias_analysis(model_path, csv_path, sensitive_col):
    """
    Load a sklearn .pkl model, run predictions on test CSV,
    then analyze bias in those predictions.
    Returns full analysis dict.
    """
    # Load model
    model = load_model(model_path)

    # Load test data
    df = pd.read_csv(csv_path)

    if sensitive_col not in df.columns:
        raise ValueError(f"Sensitive column '{sensitive_col}' not found in CSV")

    # Prepare features (drop sensitive col and any non-numeric)
    sensitive_values = df[sensitive_col].copy()
    feature_df = df.copy()

    # Encode any string columns for prediction
    for col in feature_df.columns:
        if feature_df[col].dtype == 'object' or str(feature_df[col].dtype) == 'string' or str(feature_df[col].dtype) == 'str':
            from sklearn.preprocessing import LabelEncoder
            le = LabelEncoder()
            feature_df[col] = le.fit_transform(feature_df[col].astype(str))

    # Get model predictions
    try:
        predictions = model.predict(feature_df)
    except Exception as e:
        # Try dropping sensitive col if model wasn't trained on it
        feature_df2 = feature_df.drop(columns=[sensitive_col], errors='ignore')
        predictions = model.predict(feature_df2)

    # Build result df with predictions + sensitive attribute
    result_df = pd.DataFrame({
        sensitive_col: sensitive_values,
        'prediction': predictions
    })

    # Run bias metrics on predictions
    demographic_parity = calculate_demographic_parity(result_df, 'prediction', sensitive_col)
    disparate_impact = calculate_disparate_impact(result_df, 'prediction', sensitive_col)
    fairness_score = calculate_overall_fairness_score(demographic_parity, disparate_impact)

    # Determine verdict
    if fairness_score < 50:
        verdict = 'biased'
    elif fairness_score < 75:
        verdict = 'warning'
    else:
        verdict = 'fair'

    positive_rate = float(np.mean(predictions))
    groups = list(demographic_parity.keys())

    # Group counts for composition chart
    group_counts = result_df[sensitive_col].value_counts().to_dict()
    group_counts = {str(k): int(v) for k, v in group_counts.items()}

    return {
        'demographic_parity': demographic_parity,
        'disparate_impact': round(float(disparate_impact), 4),
        'fairness_score': int(fairness_score),
        'verdict': verdict,
        'dataset_size': len(df),
        'groups': groups,
        'group_counts': group_counts,
        'target_col': 'model_prediction',
        'sensitive_col': sensitive_col,
        'positive_rate': round(positive_rate, 4),
        'analysis_type': 'model',
        'dataset_name': 'Model Bias Analysis',
        'analysis_timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M')
    }
