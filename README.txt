---

#  Money Muling Detection System

### Graph-Based Suspicious Transaction Detection using FastAPI & Network Analysis

The **Money Muling Detection System** is a backend-driven analytical platform designed to identify suspicious financial transaction behavior that may indicate **money muling activity**.
The system analyzes transaction records uploaded as CSV files and uses graph-based modeling, statistical analysis, and risk scoring techniques to detect potentially fraudulent accounts.

The project provides a complete pipeline including:

* File upload interface (Frontend)
* API processing (FastAPI backend)
* Transaction graph generation
* Risk scoring
* Suspicious pattern detection

---

##  What is Money Muling?

Money muling is a financial crime in which an individual transfers illegally obtained money between accounts to obscure the origin of funds. Criminal networks typically use multiple intermediary accounts (mules) to:

* Break traceability
* Launder stolen money
* Move funds quickly across accounts

Detecting such activity requires **relationship-based analysis**, not just simple transaction monitoring.
Therefore this project uses **graph/network analysis** instead of traditional rule-based detection.

---

## 🎯 Project Objectives

The goal of this system is to:

* Automatically process large transaction datasets
* Model financial transactions as a network graph
* Identify abnormal flow of funds
* Score accounts by suspicious behavior
* Detect mule accounts and transaction chains
* Provide structured detection results through API

---

##  System Architecture

The application follows a **3-layer architecture**:

### 1. Frontend (Vue.js)

Responsible for user interaction:

* Upload single CSV file
* Upload multiple CSV files (folder)
* Trigger detection
* Display results

### 2. Backend (FastAPI)

Responsible for processing:

* File handling
* Data validation
* Graph building
* Risk computation
* Pattern detection

### 3. Detection Engine

Responsible for intelligence:

* Transaction modeling
* Feature extraction
* Suspicious behavior scoring

---

### Architecture Flow

```
User Upload → FastAPI Server → Data Processing → Graph Construction → Risk Engine → Detection Results
```

---

## ⚙️ Technologies Used

### Backend

* Python
* FastAPI
* Pandas
* NumPy
* NetworkX

### Frontend

* Vue.js
* JavaScript
* Axios (API communication)

### Data Processing

* CSV parsing
* Time window aggregation
* Network graph modeling

---

## 📂 Repository Structure

```
Money_muling/
│
├── backend/
│   ├── routers/           # API endpoints
│   ├── main_engine/       # detection engine
│   ├── build_graph.py     # transaction graph construction
│   ├── detect.py          # detection logic
│   └── utils.py           # helper functions
│
├── frontend/              # Vue.js interface
│
├── .gitignore
└── README.md
```

---

## 🚀 Installation & Setup

### 1️⃣ Clone Repository

```bash
git clone https://github.com/VishalLa/Money_muling.git
cd Money_muling
```

---

### 2️⃣ Create Virtual Environment

```bash
python -m venv venv
```

**Windows**

```
venv\Scripts\activate
```

**Linux/Mac**

```
source venv/bin/activate
```

---

### 3️⃣ Install Dependencies

```
pip install -r requirements.txt
```

---

### 4️⃣ Run Backend Server

```
uvicorn backend.main:app --reload
```

Server will run at:

```
http://127.0.0.1:8000
```

Swagger Documentation:

```
http://127.0.0.1:8000/docs
```

---

## 📤 API Endpoint

### Detect Suspicious Accounts

**POST** `/detect`

Accepts:

* One CSV file
* Multiple CSV files

Returns:

* Suspicious accounts
* Risk scores
* Transaction clusters

---

## 📄 Expected Input Format

| sender | receiver | amount | timestamp           |
| ------ | -------- | ------ | ------------------- |
| A101   | B302     | 15000  | 2024-01-01 12:30:00 |

**Fields:**

* `sender` → Account ID transferring money
* `receiver` → Account receiving money
* `amount` → Transaction value
* `timestamp` → Date & time of transaction

---

## 🔍 Detection Methodology

The system follows a multi-stage detection pipeline.

### 1. Data Validation

* Check CSV structure
* Remove invalid records

### 2. Data Cleaning

* Handle missing values
* Convert timestamps
* Normalize data types

### 3. Time Window Creation

Transactions are grouped into rolling time windows to detect rapid movement of funds.

---

### 4. Graph Construction

Each transaction dataset is converted into a network:

* Account → Node
* Transaction → Directed Edge
* Amount → Edge weight

This allows relationship-based analysis.

---

### 5. Feature Engineering

For each account:

* In-degree (incoming transactions)
* Out-degree (outgoing transactions)
* Total inflow
* Total outflow
* Flow ratio
* Transaction frequency

---

### 6. Risk Scoring

A normalized feature vector is computed and transformed into a risk score using a sigmoid function:

```
Risk Score = 1 / (1 + e^(-x))
```

Higher score → higher suspicion.

---

### 7. Pattern Detection

The engine identifies common mule behaviors:

• Rapid fund movement
• Circular transfers
• Intermediate accounts
• High fan-in/fan-out nodes
• Short-time chained transfers

---

## 🚨 Suspicious Patterns Detected

### Circular Transactions

```
A → B → C → A
```

### Layering Chain

```
A → B → C → D → E
```

### Hub Account

```
      B
      ↑
A →   X   → C
      ↓
      D
```

These patterns indicate possible laundering networks.

---

## 📊 Output

The system produces a JSON response:

* List of suspicious accounts
* Risk score per account
* Transaction summary

---

## 📈 Scalability

The system is designed for:

* 10,000 – 50,000+ transactions
* Modular processing
* Extensible detection engine

---

## 🔮 Future Improvements

* Machine Learning anomaly detection
* Real-time transaction monitoring
* Database integration (PostgreSQL)
* Authentication system
* Dashboard analytics
* Cloud deployment

---
