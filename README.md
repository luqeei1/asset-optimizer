# 📈 Asset Optimization Using Sharpe Ratio

🚧 **Note:** This project is still under development. Further UI improvements and minor functionality changes are to be expected in the near future. Historical portfolio managment will also be provided soon.  

Welcome to my full-stack asset optimization application!  
This project leverages the **Sharpe ratio** to help users optimize their investment portfolios. It also includes:

- 📰 A **news** section with financial updates  
- ⏰ A **stock market opening/closing time comparator**  
- 💼 A **portfolio optimizer** using the Sharpe ratio  

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (TypeScript) + Tailwind CSS  
- **Backend:** Express.js (TypeScript)  
- **Microservice:** Python + FastAPI  
- **Libraries:** `yfinance`, `numpy`, `scipy`, `pandas`, `fastapi`, `uvicorn`, `pydantic`,`Charts.js`

---

## 🚀 Getting Started

### 1. Start the FastAPI Backend

```bash
cd fastapi_backend
python -m venv venv
venv\Scripts\activate  # On Windows
# Or use 'source venv/bin/activate' on Mac/Linux
pip install fastapi uvicorn pydantic yfinance numpy scipy pandas
uvicorn main:app --reload
```

### 2. Start the Express.js backend

```bash
cd express_backend
npx tsc
npm start
```

### 3. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

