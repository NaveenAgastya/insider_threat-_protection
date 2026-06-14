# 🛡️ Behavioral AI Risk Scoring & Investigation System

## 📌 Overview

This project is a real-time **behavioral risk detection and investigation system** that identifies suspicious user activity using a combination of:

- Machine Learning (Isolation Forest anomaly detection)
- Rule-based risk scoring engine
- Behavioral user profiling
- Real-time scoring API
- Interactive investigation dashboard

It is designed to help security teams and investigators detect, analyze, and respond to potentially fraudulent or abnormal user behavior efficiently.

---

## ⚙️ Key Features

### 🧠 Machine Learning Risk Engine (Step 1 Completed)
- Feature engineering from raw user activity logs
- Behavioral profiling per user
- Isolation Forest-based anomaly detection
- ML-based anomaly scoring
- ML score integrated into final risk scoring pipeline

---

### 📊 Rule-Based Risk Engine
- Security rules for detecting suspicious behavior
- Examples: IP mismatch, unusual login time, device changes
- Weighted scoring system
- Fully explainable logic

---

### 🔗 Hybrid Risk Scoring System
Final risk score is computed using:
- ML anomaly score
- Rule-based score
- Behavioral context signals

This ensures a balanced and more accurate risk decision system.

---

### 🌐 Backend (FastAPI)
- Real-time scoring API
- User investigation endpoints
- ML + rule engine integration
- JSON-based structured responses

---

### 🖥️ Frontend (React Dashboard)
- User investigation dashboard
- Risk score visualization
- Behavioral history timeline
- Alert and flagged user tracking

---

### 📈 Investigation System
- User-level behavioral history tracking
- Risk timeline visualization
- Explanation of risk decisions
- Investigator review support

---

## 🧠 System Architecture
User Activity Data
↓
Feature Engineering Layer
↓
Behavioral Profiling System
↓
ML Model (Isolation Forest)
↓
Rule-Based Engine
↓
Risk Orchestrator (Decision Layer)
↓
Final Risk Score API
↓
React Investigation Dashboard


---

## 🏗️ Tech Stack

### Backend
- FastAPI
- Python 3.10+
- Scikit-learn
- Pandas
- NumPy

### Frontend
- React.js
- Axios
- Recharts / Chart.js

### Machine Learning
- Isolation Forest (Anomaly Detection)
- Feature Engineering Pipeline
- Behavioral Pattern Analysis

---

## 📁 Project Structure
project-root/
│
├── backend/
|
│ │ ├── main.py
│ │ ├── services/
│ │ │ ├── risk_engine.py
│ │
│ ├── requirements.txt
│
├──  src/
│ │ ├── pages/
│ │ ├── components/
│ │ |     ├── Ui/
│ │ ├── lib/
│ │ └── App.tsx
│ └── package.json
│
└── README.md


---

## 🚀 Installation Guide

### 1️⃣ Clone Repository
```bash
git clone https://github.com/NaveenAgastya/insider_threat-_protection.git
