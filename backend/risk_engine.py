from xml.parsers.expat import model

import pandas as pd
from sklearn.ensemble import IsolationForest

def calculate_user_risks(access_df, profile_df):

    risk_scores = {}
    user_features = []

    for _, row in access_df.iterrows():

        user = row["user_id"]

        score = 0

        if row["resource_sensitivity"] == "high":
            score += 25

        if row["time_classification"] in [
            "night",
            "weekend",
            "unusual_hours"
        ]:
            score += 20

        if row["action"] == "export_data":
            score += 30

        if row["action"] == "admin_operation":
            score += 20

        if row["status"] == "failure":
            score += 15

        risk_scores[user] = risk_scores.get(user, 0) + score

    results = []

    #model trainig code
    for user_id in access_df["user_id"].unique():

        user_logs = access_df[
        access_df["user_id"] == user_id
        ]

        user_features.append({
        "user_id": user_id,
        "total_activity": len(user_logs),
        "night_access_count": len(
            user_logs[
                user_logs["time_classification"] == "night"
            ]
        ),
        "weekend_access_count": len(
            user_logs[
                user_logs["time_classification"] == "weekend"
            ]
        ),
        "unusual_hours_count": len(
            user_logs[
                user_logs["time_classification"] == "unusual_hours"
            ]
        ),
        "high_sensitivity_access": len(
            user_logs[
                user_logs["resource_sensitivity"] == "high"
            ]
        ),
        "export_count": len(
            user_logs[
                user_logs["action"] == "export_data"
            ]
        ),
        "admin_operation_count": len(
            user_logs[
                user_logs["action"] == "admin_operation"
            ]
        ),
        "failed_access_count": len(
            user_logs[
                user_logs["status"] == "failure"
            ]
        ),
        "distinct_resources":
            user_logs["resource"].nunique()
        })

    features_df = pd.DataFrame(user_features)
    feature_cols = [
                        "total_activity",
                        "night_access_count",
                        "weekend_access_count",
                        "unusual_hours_count",
                        "high_sensitivity_access",
                        "export_count",
                        "admin_operation_count",
                        "failed_access_count",
                        "distinct_resources"
                        ]

    model = IsolationForest(
        contamination=0.17,
        random_state=42
        )

    model.fit(features_df[feature_cols])

    features_df["ml_anomaly"] = model.predict(
        features_df[feature_cols]
        )

    features_df["ml_score"] = (
        model.decision_function(
        features_df[feature_cols]
        )
        )
    print(
    features_df[
        ["user_id", "ml_anomaly", "ml_score"]
    ].sort_values(
        "ml_score"
    ).head(10)
   )
    
    for _, profile in profile_df.iterrows():

        uid = profile["user_id"]

        score = risk_scores.get(uid, 0)

        ml_row = features_df[
        features_df["user_id"] == uid
        ]

        if len(ml_row) > 0:

            if ml_row.iloc[0]["ml_anomaly"] == -1:

                ml_score = ml_row.iloc[0]["ml_score"]

                if ml_score < -0.05:
                    score += 40

                elif ml_score < -0.02:
                    score += 30

                else:
                    score += 20
                    
        if profile["days_inactive"] > 45:
                score += 25

        if profile["privilege_level"] in [
                "power-user",
                "service-account"
                ]:
            
            score += 15

        score = min(score, 100)

        if score >= 80:
            level = "critical"
        elif score >= 60:
            level = "high"
        elif score >= 40:
            level = "medium"
        else:
            level = "low"

        results.append({
            "id": uid,
            "name": profile["username"],
            "email": profile["email"],
            "department": profile["department"],
            "riskScore": score,
            "riskLevel": level,
            "alerts": round(score / 10),
            "lastActivity": "Recently",
            "location": "Unknown",
            "device": "Corporate Device",
            "status": "active",
            "mlAnomaly": int(ml_row.iloc[0]["ml_anomaly"]),
            "mlScore": round(float(ml_row.iloc[0]["ml_score"]), 4)
        })

 

    return sorted(
        results,
        key=lambda x: x["riskScore"],
        reverse=True
    )

#ML model code to calculate anomaly scores for users based on their activity patterns
def get_ml_results(access_df, profile_df):

    user_features = []

    for user_id in access_df["user_id"].unique():

        user_logs = access_df[
            access_df["user_id"] == user_id
        ]

        user_features.append({
            "user_id": user_id,
            "total_activity": len(user_logs),
            "night_access_count": len(
                user_logs[user_logs["time_classification"] == "night"]
            ),
            "weekend_access_count": len(
                user_logs[user_logs["time_classification"] == "weekend"]
            ),
            "unusual_hours_count": len(
                user_logs[user_logs["time_classification"] == "unusual_hours"]
            ),
            "high_sensitivity_access": len(
                user_logs[user_logs["resource_sensitivity"] == "high"]
            ),
            "export_count": len(
                user_logs[user_logs["action"] == "export_data"]
            ),
            "admin_operation_count": len(
                user_logs[user_logs["action"] == "admin_operation"]
            ),
            "failed_access_count": len(
                user_logs[user_logs["status"] == "failure"]
            ),
            "distinct_resources": user_logs["resource"].nunique()
        })

    features_df = pd.DataFrame(user_features)

    feature_cols = [
        "total_activity",
        "night_access_count",
        "weekend_access_count",
        "unusual_hours_count",
        "high_sensitivity_access",
        "export_count",
        "admin_operation_count",
        "failed_access_count",
        "distinct_resources"
    ]

    model = IsolationForest(
        contamination=0.17,
        random_state=42
    )

    model.fit(features_df[feature_cols])

    features_df["ml_anomaly"] = model.predict(
        features_df[feature_cols]
    )

    features_df["ml_score"] = model.decision_function(
        features_df[feature_cols]
    )

    return features_df[
    features_df["ml_anomaly"] == -1
].to_dict(orient="records")