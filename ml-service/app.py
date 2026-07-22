import os
import re
import json
import logging
import numpy as np
from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODEL_DIR, exist_ok=True)
MODEL_PATH = os.path.join(MODEL_DIR, "isolation_forest.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")


def extract_features(log_lines):
    """Extract numerical features from raw log lines for anomaly detection."""
    if not log_lines:
        return None

    total_lines = len(log_lines)
    if total_lines == 0:
        return None

    error_count = 0
    warning_count = 0
    info_count = 0
    unique_ips = set()
    unique_ports = set()
    failed_auth = 0
    timeout_count = 0
    null_bytes = 0
    special_char_count = 0
    max_line_length = 0
    total_line_length = 0
    unique_endpoints = set()
    http_errors = 0
    sql_keywords = 0
    shell_keywords = 0
    unusual_user_agents = 0
    port_scan迹象 = 0
    rate_limit_hits = 0
    connection_resets = 0

    ip_pattern = re.compile(r'\b(?:\d{1,3}\.){3}\d{1,3}\b')
    port_pattern = re.compile(r'(?:port|:)(\d{2,5})\b', re.IGNORECASE)
    error_keywords = re.compile(r'\b(error|exception|fatal|critical|fail|denied|refused|rejected)\b', re.IGNORECASE)
    warning_keywords = re.compile(r'\b(warn|warning|timeout|retry|limit|slow)\b', re.IGNORECASE)
    info_keywords = re.compile(r'\b(info|notice|debug|ok|success|accepted)\b', re.IGNORECASE)
    auth_fail_pattern = re.compile(r'(\b(auth|login|password|credential|unauthorized|forbidden)\b.*\b(fail(?:ed|s|ure|ing)?|denied?|invalid|incorrect|wrong)\b|\b(fail(?:ed|s|ure|ing)?|denied?|invalid|incorrect|wrong)\b.*\b(auth|login|password|credential|unauthorized|forbidden)\b)', re.IGNORECASE)
    timeout_pattern = re.compile(r'\b(timeout|timed?\s*out|expir|connection\s+reset)\b', re.IGNORECASE)
    endpoint_pattern = re.compile(r'(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(/\S+)', re.IGNORECASE)
    http_error_pattern = re.compile(r'\b[45]\d{2}\b')
    sql_pattern = re.compile(r'\b(select|insert|update|delete|drop|truncate|exec|union|declare|sleep)\b', re.IGNORECASE)
    shell_pattern = re.compile(r'\b(bash|sh|cmd|powershell|wget|curl|chmod|chown|sudo|rm\s+-rf)\b', re.IGNORECASE)
    ua_pattern = re.compile(r'User-Agent:\s*(.+)', re.IGNORECASE)
    port_scan_pattern = re.compile(r'\b(scan|probe|nmap|masscan|zmap)\b', re.IGNORECASE)
    rate_limit_pattern = re.compile(r'\b(rate.?limit|too.?many.?requests|429|throttl)\b', re.IGNORECASE)
    conn_reset_pattern = re.compile(r'\b(reset|abort|broken\s+pipe|connection\s+refused)\b', re.IGNORECASE)

    for line in log_lines:
        line_stripped = line.strip()
        line_len = len(line_stripped)
        total_line_length += line_len
        if line_len > max_line_length:
            max_line_length = line_len

        if '\x00' in line_stripped:
            null_bytes += 1

        special_chars = sum(1 for c in line_stripped if not c.isalnum() and not c.isspace())
        special_char_count += special_chars

        if error_keywords.search(line_stripped):
            error_count += 1
        elif warning_keywords.search(line_stripped):
            warning_count += 1
        elif info_keywords.search(line_stripped):
            info_count += 1

        ips = ip_pattern.findall(line_stripped)
        unique_ips.update(ips)

        ports = port_pattern.findall(line_stripped)
        unique_ports.update(ports)

        if auth_fail_pattern.search(line_stripped):
            failed_auth += 1

        if timeout_pattern.search(line_stripped):
            timeout_count += 1

        endpoint_match = endpoint_pattern.search(line_stripped)
        if endpoint_match:
            unique_endpoints.add(endpoint_match.group(2))

        if http_error_pattern.search(line_stripped):
            http_errors += 1

        if sql_pattern.search(line_stripped):
            sql_keywords += 1

        if shell_pattern.search(line_stripped):
            shell_keywords += 1

        if port_scan_pattern.search(line_stripped):
            port_scan迹象 += 1

        if rate_limit_pattern.search(line_stripped):
            rate_limit_hits += 1

        if conn_reset_pattern.search(line_stripped):
            connection_resets += 1

    avg_line_length = total_line_length / total_lines if total_lines > 0 else 0
    unique_ip_ratio = len(unique_ips) / total_lines if total_lines > 0 else 0
    unique_port_ratio = len(unique_ports) / total_lines if total_lines > 0 else 0
    error_ratio = error_count / total_lines if total_lines > 0 else 0
    warning_ratio = warning_count / total_lines if total_lines > 0 else 0
    special_char_ratio = special_char_count / total_line_length if total_line_length > 0 else 0

    features = np.array([[
        total_lines,
        error_count,
        warning_count,
        info_count,
        len(unique_ips),
        len(unique_ports),
        failed_auth,
        timeout_count,
        null_bytes,
        special_char_count,
        max_line_length,
        avg_line_length,
        unique_ip_ratio,
        unique_port_ratio,
        error_ratio,
        warning_ratio,
        special_char_ratio,
        len(unique_endpoints),
        http_errors,
        sql_keywords,
        shell_keywords,
        port_scan迹象,
        rate_limit_hits,
        connection_resets,
    ]])

    return features


def get_severity(score):
    """Map anomaly score to severity level."""
    if score <= -0.6:
        return "critical"
    elif score <= -0.4:
        return "high"
    elif score <= -0.2:
        return "medium"
    elif score <= 0:
        return "low"
    else:
        return "none"


def generate_summary(is_anomaly, severity, score, feature_names, feature_values):
    """Generate a human-readable analysis summary."""
    summary_parts = []

    if is_anomaly:
        summary_parts.append(f"Anomaly detected with {severity} severity.")
    else:
        summary_parts.append("No anomaly detected. Log appears normal.")

    error_count = int(feature_values[feature_names.index("error_count")] if "error_count" in feature_names else 0)
    warning_count = int(feature_values[feature_names.index("warning_count")] if "warning_count" in feature_names else 0)
    unique_ips = int(feature_values[feature_names.index("unique_ips")] if "unique_ips" in feature_names else 0)
    failed_auth = int(feature_values[feature_names.index("failed_auth")] if "failed_auth" in feature_names else 0)
    sql_keywords = int(feature_values[feature_names.index("sql_keywords")] if "sql_keywords" in feature_names else 0)
    shell_keywords = int(feature_values[feature_names.index("shell_keywords")] if "shell_keywords" in feature_names else 0)
    port_scans = int(feature_values[feature_names.index("port_scan")] if "port_scan" in feature_names else 0)
    total_lines = int(feature_values[feature_names.index("total_lines")] if "total_lines" in feature_names else 0)

    indicators = []
    if error_count > total_lines * 0.1:
        indicators.append(f"{error_count} errors found ({round(error_count/total_lines*100, 1)}% error rate)")
    if warning_count > total_lines * 0.15:
        indicators.append(f"{warning_count} warnings detected")
    if unique_ips > 20:
        indicators.append(f"{unique_ips} unique source IPs (possible distributed activity)")
    if failed_auth > 3:
        indicators.append(f"{failed_auth} authentication failures detected")
    if sql_keywords > 5:
        indicators.append(f"{sql_keywords} SQL keywords found (possible injection attempt)")
    if shell_keywords > 2:
        indicators.append(f"{shell_keywords} shell commands detected")
    if port_scans > 0:
        indicators.append("Port scanning activity detected")

    if indicators:
        summary_parts.append("Key indicators: " + "; ".join(indicators) + ".")

    return " ".join(summary_parts)


model = None
scaler = None
FEATURE_NAMES = [
    "total_lines", "error_count", "warning_count", "info_count",
    "unique_ips", "unique_ports", "failed_auth", "timeout_count",
    "null_bytes", "special_chars", "max_line_length", "avg_line_length",
    "unique_ip_ratio", "unique_port_ratio", "error_ratio", "warning_ratio",
    "special_char_ratio", "unique_endpoints", "http_errors", "sql_keywords",
    "shell_keywords", "port_scan", "rate_limit_hits", "connection_resets",
]


def train_initial_model():
    """Train an initial Isolation Forest model with synthetic normal + anomaly data."""
    global model, scaler
    logger.info("Training initial Isolation Forest model...")

    np.random.seed(42)
    n_normal = 500
    n_anomaly = 50

    normal_data = np.column_stack([
        np.random.randint(50, 5000, n_normal),
        np.random.poisson(2, n_normal),
        np.random.poisson(5, n_normal),
        np.random.poisson(50, n_normal),
        np.random.randint(1, 15, n_normal),
        np.random.randint(0, 8, n_normal),
        np.random.poisson(0.2, n_normal),
        np.random.poisson(0.5, n_normal),
        np.zeros(n_normal),
        np.random.poisson(10, n_normal),
        np.random.randint(40, 300, n_normal),
        np.random.uniform(60, 150, n_normal),
        np.random.uniform(0.001, 0.01, n_normal),
        np.random.uniform(0, 0.01, n_normal),
        np.random.uniform(0, 0.02, n_normal),
        np.random.uniform(0, 0.03, n_normal),
        np.random.uniform(0.01, 0.05, n_normal),
        np.random.randint(5, 50, n_normal),
        np.random.poisson(1, n_normal),
        np.random.poisson(0.1, n_normal),
        np.random.poisson(0.05, n_normal),
        np.zeros(n_normal),
        np.random.poisson(0.1, n_normal),
        np.random.poisson(0.1, n_normal),
    ]).astype(float)

    anomaly_data = np.column_stack([
        np.random.randint(10, 100, n_anomaly),
        np.random.poisson(15, n_anomaly),
        np.random.poisson(20, n_anomaly),
        np.random.poisson(5, n_anomaly),
        np.random.randint(30, 200, n_anomaly),
        np.random.randint(10, 50, n_anomaly),
        np.random.poisson(8, n_anomaly),
        np.random.poisson(10, n_anomaly),
        np.random.poisson(3, n_anomaly),
        np.random.poisson(200, n_anomaly),
        np.random.randint(200, 2000, n_anomaly),
        np.random.uniform(150, 500, n_anomaly),
        np.random.uniform(0.1, 0.8, n_anomaly),
        np.random.uniform(0.05, 0.3, n_anomaly),
        np.random.uniform(0.1, 0.5, n_anomaly),
        np.random.uniform(0.1, 0.4, n_anomaly),
        np.random.uniform(0.1, 0.3, n_anomaly),
        np.random.randint(2, 10, n_anomaly),
        np.random.poisson(10, n_anomaly),
        np.random.poisson(8, n_anomaly),
        np.random.poisson(5, n_anomaly),
        np.random.randint(1, 10, n_anomaly),
        np.random.poisson(5, n_anomaly),
        np.random.poisson(5, n_anomaly),
    ]).astype(float)

    X = np.vstack([normal_data, anomaly_data])

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    model = IsolationForest(
        n_estimators=150,
        contamination=0.08,
        max_samples="auto",
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X_scaled)

    joblib.dump(model, MODEL_PATH)
    joblib.dump(scaler, SCALER_PATH)
    logger.info("Model trained and saved successfully.")


def load_model():
    global model, scaler
    if os.path.exists(MODEL_PATH) and os.path.exists(SCALER_PATH):
        logger.info("Loading saved model...")
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        logger.info("Model loaded successfully.")
    else:
        train_initial_model()


load_model()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model_loaded": model is not None})


@app.route("/predict", methods=["POST"])
def predict():
    try:
        data = request.get_json(force=True)

        if not data:
            return jsonify({"error": "No data provided"}), 400

        log_lines = data.get("log_lines")
        if log_lines is None:
            log_text = data.get("log_text", "")
            if not log_text:
                return jsonify({"error": "Either 'log_lines' (array) or 'log_text' (string) is required"}), 400
            log_lines = [line for line in log_text.split("\n") if line.strip()]

        if not log_lines:
            return jsonify({"error": "Log data is empty after parsing"}), 400

        features = extract_features(log_lines)
        if features is None:
            return jsonify({"error": "Could not extract features from log data"}), 400

        features_scaled = scaler.transform(features)
        prediction = model.predict(features_scaled)
        anomaly_score = model.decision_function(features_scaled)[0]

        is_anomaly = prediction[0] == -1
        severity = get_severity(anomaly_score)
        summary = generate_summary(is_anomaly, severity, anomaly_score, FEATURE_NAMES, features[0].tolist())

        feature_importance = {}
        for i, name in enumerate(FEATURE_NAMES):
            feature_importance[name] = round(float(features[0][i]), 4)

        result = {
            "is_anomaly": bool(is_anomaly),
            "anomaly_score": round(float(anomaly_score), 4),
            "severity": severity,
            "summary": summary,
            "total_lines_analyzed": len(log_lines),
            "feature_importance": feature_importance,
        }

        logger.info(f"Prediction: is_anomaly={is_anomaly}, score={anomaly_score:.4f}, severity={severity}")
        logger.info(f"Feature importance: {json.dumps(feature_importance, indent=2)}")
        return jsonify(result)

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500


if __name__ == "__main__":
    port = int(os.environ.get("ML_PORT", 5001))
    logger.info(f"Starting ML service on port {port}")
    app.run(host="0.0.0.0", port=port, debug=False)
