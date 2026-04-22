import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder
import pickle, os

np.random.seed(42)
n = 400

gender = np.random.choice(['Male', 'Female'], n, p=[0.6, 0.4])
age = np.random.randint(22, 55, n)
education = np.random.choice([0, 1, 2], n, p=[0.5, 0.35, 0.15])
experience = np.random.randint(0, 20, n)
skills = np.random.randint(50, 100, n)

# Deliberately biased: penalize females in training
hired = []
for i in range(n):
    base = 0.3 + 0.01*experience[i] + 0.005*skills[i]
    if gender[i] == 'Female':
        base -= 0.25  # artificial bias baked into model
    hired.append(1 if np.random.random() < min(max(base, 0.05), 0.95) else 0)

df = pd.DataFrame({
    'age': age,
    'gender': gender,
    'education': education,
    'experience': experience,
    'skills': skills,
    'hired': hired
})

# Encode gender for training
df_train = df.copy()
df_train['gender'] = (df_train['gender'] == 'Male').astype(int)
features = ['age', 'gender', 'education', 'experience', 'skills']
X = df_train[features]
y = df_train['hired']

model = LogisticRegression(max_iter=1000)
model.fit(X, y)

os.makedirs('demo', exist_ok=True)
with open('demo/biased_model.pkl', 'wb') as f:
    pickle.dump(model, f)

# Save test CSV WITHOUT hired column (model will predict)
test_df = df[['age', 'gender', 'education', 'experience', 'skills']].copy()
test_df.to_csv('demo/test_data.csv', index=False)
print("Generated demo/biased_model.pkl and demo/test_data.csv")
