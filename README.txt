---

# 🎯 Slide 1 – Title Slide

## **Money Muling Detection System**

Graph-Based Financial Crime Detection

**Include:**

* Your Name: Vishal Ladoiya
* Technology: FastAPI + NetworkX + Vue.js
* Submission / Course Name

---

# 🧱 Slide 2 – System Overview (High-Level Flow Diagram)

### Use: Horizontal Process Flow Diagram

Draw this:

```
[ CSV Upload ]
        ↓
[ Data Processing ]
        ↓
[ Graph Construction ]
        ↓
[ Risk Scoring ]
        ↓
[ Suspicious Account Detection ]
```

### Short Description Under Diagram:

* Upload transaction data
* Convert transactions into graph
* Analyze fund flow patterns
* Score accounts based on risk
* Output suspicious accounts

---

# 🏗 Slide 3 – System Architecture Diagram

### Use: Layered Architecture Diagram

Draw this:

```
               ┌────────────────────┐
               │      Frontend      │
               │      (Vue.js)      │
               │ File Upload UI     │
               └──────────┬─────────┘
                          │ API Call
                          ▼
               ┌────────────────────┐
               │  Backend (FastAPI) │
               │ - CSV Validation   │
               │ - Data Cleaning    │
               │ - Graph Builder    │
               │ - Risk Engine      │
               └──────────┬─────────┘
                          ▼
               ┌────────────────────┐
               │ Detection Results  │
               │ - Risk Scores      │
               │ - Suspicious Nodes │
               │ - Transaction Flow │
               └────────────────────┘
```

---

# 🔄 Slide 4 – Detection Workflow

### Use: Step-by-Step Flowchart

```
1. CSV Validation
        ↓
2. Data Cleaning
        ↓
3. Time Window Creation
        ↓
4. Graph Construction
        ↓
5. Feature Engineering
        ↓
6. Risk Scoring (Sigmoid)
        ↓
7. Pattern Identification
        ↓
8. JSON Response Output
```

Add small explanation bullets on the side.

---

# 🕸 Slide 5 – Graph Construction Logic

### Use: Network Diagram Illustration

Draw circles representing accounts:

```
A → B → C → D
      ↘
        E
```

Explain:

* Each account = Node
* Each transaction = Edge
* Edge weight = Transaction amount
* Time window = Edge grouping

Mention:

* Circular chains
* Rapid fund movement
* Intermediary accounts

---

# 📊 Slide 6 – Risk Scoring Model

### Use: Block + Formula Slide

```
Features Extracted:
- In-degree
- Out-degree
- Total Inflow
- Total Outflow
- Flow Ratio
- Time Frequency
```

Then:

```
Risk Score = Sigmoid(Weighted Features)
```

Explain:

* Normalization applied
* Higher score → Higher suspicion

---

# 🚨 Slide 7 – Suspicious Patterns Detected

### Use: 3 Mini Graphs Side by Side

1️⃣ Circular Transactions

```
A → B → C → A
```

2️⃣ Rapid Transfers

```
A → B → C → D (within minutes)
```

3️⃣ Hub Account

```
      B
      ↑
A →   X   → C
      ↓
      D
```

Explain:

* Mule accounts often act as temporary hubs

---

# 🧰 Slide 8 – Technology Stack

Use simple 2-column layout:

### Backend

* FastAPI
* Python
* Pandas
* NumPy
* NetworkX

### Frontend

* Vue.js
* Axios
* File Upload UI

---

# 📈 Slide 9 – Scalability

Use block diagram:

```
Large CSV Files
        ↓
Efficient Pandas Processing
        ↓
Optimized Graph Building
        ↓
Modular Risk Engine
```

Mention:

* Handles 10k–50k+ transactions
* Modular design
* Easy ML integration

---

# 🔮 Slide 10 – Future Improvements

Use icons or blocks:

* Machine Learning Anomaly Detection
* Real-Time Monitoring
* Database Integration
* Cloud Deployment
* Dashboard Analytics

---

# 🎁 BONUS – If You Want It More Professional

Use these PowerPoint SmartArt types:

* Process → Basic Process (for workflow)
* Hierarchy → Layered Architecture
* Relationship → Radial Diagram (for graph logic)
* Cycle → For circular pattern slide

---
