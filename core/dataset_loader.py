import pandas as pd


def load_csv(filepath):
    """
    Load a CSV file into a DataFrame.
    Returns (df, column_list, shape_tuple).
    """
    try:
        df = pd.read_csv(filepath)
        column_list = df.columns.tolist()
        shape_tuple = df.shape
        return df, column_list, shape_tuple
    except Exception as e:
        raise ValueError(f"Failed to load CSV file: {str(e)}")


def detect_column_types(df):
    """
    Detect likely target and sensitive attribute columns.
    Returns {'likely_target': [...], 'likely_sensitive': [...]}.
    
    likely_target: binary columns (0/1 or yes/no values)
    likely_sensitive: columns with names suggesting demographic attributes
    """
    likely_target = []
    likely_sensitive = []

    sensitive_keywords = [
        'gender', 'sex', 'race', 'ethnicity', 'age', 'age_group',
        'religion', 'disability', 'nationality', 'marital_status',
        'sexual_orientation', 'color', 'origin', 'language'
    ]

    for col in df.columns:
        col_lower = col.strip().lower()

        # Check for binary target columns
        unique_vals = df[col].dropna().unique()
        if len(unique_vals) == 2:
            val_set = set(str(v).strip().lower() for v in unique_vals)
            binary_pairs = [
                {'0', '1'}, {'0.0', '1.0'},
                {'yes', 'no'}, {'true', 'false'},
                {'hired', 'not hired'}, {'approved', 'denied'},
                {'accepted', 'rejected'}, {'pass', 'fail'}
            ]
            if val_set in binary_pairs or val_set == {'0', '1'} or val_set == {'0.0', '1.0'}:
                likely_target.append(col)

        # Check for sensitive attribute columns
        for keyword in sensitive_keywords:
            if keyword in col_lower or col_lower in keyword:
                likely_sensitive.append(col)
                break

        # Also check categorical columns with few unique values as potential sensitive attributes
        if col not in likely_sensitive and df[col].dtype == 'object':
            if 2 <= df[col].nunique() <= 10:
                # Could be a sensitive attribute
                pass  # Only add if name matches keywords above

    return {
        'likely_target': likely_target,
        'likely_sensitive': likely_sensitive
    }
