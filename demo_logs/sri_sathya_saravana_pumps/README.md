# Sri Sathya Saravana Motor and Pumps — Synthetic Demo Telemetry Dataset

> [!NOTE]
> **SYNTHETIC DEMO DATA DISCLAIMER**
> These log files are **strictly synthetic demonstration data** generated for testing and demonstrating the Smart Anomaly Detection pipeline and Isolation Forest machine learning model.
> They are **NOT** real operational logs and do not contain real employee, customer, or manufacturing telemetry.

---

## Overview

This dataset models operational telemetry for **Sri Sathya Saravana Motor and Pumps**, a pump manufacturing and distribution enterprise. The logs simulate ERP, database, authentication, file storage, and SCADA telemetry.

Synthetic Employee IDs used:
- `EMP101` — Ramesh (Assembly & Production)
- `EMP102` — Priya (Inventory & Sales Billing)
- `EMP103` — Karthik (Quality Control & CAD Engineering)
- `EMP104` — Mohan (Dispatch & Warehouse Logistics)
- `EMP105` — Venkatesh (Field Support & Maintenance)

---

## Synthetic Scenarios

| File | Scenario | Description | Expected ML Classification | Security Alert Triggered |
| :--- | :--- | :--- | :--- | :--- |
| `normal_employee_activity.log` | Normal Employee Activity | Baseline ERP workflows during morning/afternoon shift (work orders, stock checks, quality sign-offs). | **Normal** (`is_anomaly: false`, score ~+0.05) | None (Clean baseline) |
| `unusual_login_activity.log` | Unusual Employee Login | Off-hours login at 02:40 AM from unmapped external IP with unauthorized database dump and CAD file queries. | **Anomaly** (`is_anomaly: true`, score ~-0.01) | `high_error_rate` / `suspicious_activity` |
| `failed_login_activity.log` | Repeated Failed Login | Rapid credential stuffing burst against ERP login portal across multiple accounts within 20 seconds. | **Anomaly** (`is_anomaly: true`, score ~-0.02) | `brute_force` |
| `excessive_file_access.log` | Excessive File Access | Rapid sequential download burst of 20+ confidential pump CAD designs and financial records exceeding rate limits. | **Anomaly** (`is_anomaly: true`, score ~-0.01) | `high_error_rate` (Rate limit violations) |
| `suspicious_network_activity.log` | Suspicious Network Activity | Multi-port reconnaissance sweep probing industrial SCADA (Modbus 502), ERP DB (1433), and web services. | **Anomaly** (`is_anomaly: true`, score ~-0.02) | `port_scan` |
