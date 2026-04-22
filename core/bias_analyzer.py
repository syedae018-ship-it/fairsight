import pandas as pd
import numpy as np


def calculate_demographic_parity(df, target_col, sensitive_col):
    """
    Calculate the selection rate for each group in the sensitive column.
    Returns a dict {group_name: selection_rate} where selection_rate = count(target==1) / count(group).
    """
    groups = df[sensitive_col].unique()
    parity = {}
    for group in groups:
        group_df = df[df[sensitive_col] == group]
        total = len(group_df)
        if total == 0:
            parity[str(group)] = 0.0
        else:
            positive = len(group_df[group_df[target_col] == 1])
            parity[str(group)] = round(positive / total, 4)
    return parity


def calculate_disparate_impact(df, target_col, sensitive_col):
    """
    Calculate the disparate impact ratio: min_rate / max_rate.
    < 0.8 = biased, 0.8 - 1.2 = fair, > 1.2 = reverse bias.
    """
    parity = calculate_demographic_parity(df, target_col, sensitive_col)
    rates = list(parity.values())
    if not rates:
        return 1.0
    max_rate = max(rates)
    min_rate = min(rates)
    if max_rate == 0:
        return 1.0
    return round(min_rate / max_rate, 4)


def calculate_overall_fairness_score(demographic_parity, disparate_impact):
    """
    Calculate an overall fairness score from 0-100.

    The disparate impact ratio determines the base score band.
    Demographic parity variance provides a minor adjustment (±5 pts).

    Disparate impact mapping:
        DI < 0.6       → score  0 - 30   (heavily biased)
        DI 0.6 - 0.8   → score 30 - 50   (biased)
        DI 0.8 - 1.0   → score 75 - 100  (fair, improving toward perfect)
        DI 1.0 - 1.2   → score 100 - 75  (fair, slight over-representation)
        DI > 1.2        → score 40 - 60   (reverse bias)
    """
    # --- Base score from disparate impact (determines the band) ---
    di = disparate_impact
    if di <= 0.0:
        base_score = 0.0
    elif di < 0.6:
        # 0 → 0, 0.6 → 30  (linear interpolation)
        base_score = (di / 0.6) * 30.0
    elif di < 0.8:
        # 0.6 → 30, 0.8 → 50
        base_score = 30.0 + ((di - 0.6) / 0.2) * 20.0
    elif di <= 1.0:
        # 0.8 → 75, 1.0 → 100
        base_score = 75.0 + ((di - 0.8) / 0.2) * 25.0
    elif di <= 1.2:
        # 1.0 → 100, 1.2 → 75
        base_score = 100.0 - ((di - 1.0) / 0.2) * 25.0
    elif di <= 2.0:
        # 1.2 → 60, 2.0 → 40
        base_score = 60.0 - ((di - 1.2) / 0.8) * 20.0
    else:
        base_score = 40.0

    # --- Small adjustment from demographic parity variance (±5 pts) ---
    rates = list(demographic_parity.values())
    if len(rates) <= 1:
        dp_adjustment = 5.0  # single group = no variance = small bonus
    else:
        variance = np.var(rates)
        # variance 0 → +5, variance >= 0.1 → -5
        dp_adjustment = 5.0 - (variance / 0.1) * 10.0
        dp_adjustment = max(-5.0, min(5.0, dp_adjustment))

    total = int(round(base_score + dp_adjustment))
    return max(0, min(100, total))


def run_full_analysis(df, target_col, sensitive_col):
    """
    Run a complete bias analysis and return a comprehensive result dict.
    """
    # Ensure target column is numeric binary
    df = df.copy()
    unique_vals = df[target_col].unique()

    # Convert yes/no or true/false to 1/0
    mapping = {}
    for val in unique_vals:
        val_str = str(val).strip().lower()
        if val_str in ('yes', 'true', '1', '1.0'):
            mapping[val] = 1
        elif val_str in ('no', 'false', '0', '0.0'):
            mapping[val] = 0

    if mapping:
        df[target_col] = df[target_col].map(mapping)

    # Ensure numeric
    df[target_col] = pd.to_numeric(df[target_col], errors='coerce')
    df = df.dropna(subset=[target_col])
    df[target_col] = df[target_col].astype(int)

    demographic_parity = calculate_demographic_parity(df, target_col, sensitive_col)
    disparate_impact = calculate_disparate_impact(df, target_col, sensitive_col)
    fairness_score = calculate_overall_fairness_score(demographic_parity, disparate_impact)

    # Determine verdict
    if fairness_score < 50:
        verdict = 'biased'
    elif fairness_score < 75:
        verdict = 'warning'
    else:
        verdict = 'fair'

    # Group counts for composition chart
    group_counts = df[sensitive_col].value_counts().to_dict()
    group_counts = {str(k): int(v) for k, v in group_counts.items()}

    # Positive rate
    positive_rate = round(df[target_col].mean(), 4)

    return {
        'demographic_parity': demographic_parity,
        'disparate_impact': disparate_impact,
        'fairness_score': fairness_score,
        'verdict': verdict,
        'dataset_size': len(df),
        'groups': list(demographic_parity.keys()),
        'group_counts': group_counts,
        'target_col': target_col,
        'sensitive_col': sensitive_col,
        'positive_rate': positive_rate,
        'num_groups': len(demographic_parity),
        'analysis_timestamp': pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')
    }
