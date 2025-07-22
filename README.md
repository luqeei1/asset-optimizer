# 📈 Asset Optimization Using Sharpe Ratio

🚧 **Note:** This project is still under development. Further UI improvements and minor functionality changes are to be expected in the near future. Historical portfolio managment will also be provided soon.  

Welcome to my full-stack asset optimization application!  
This project leverages the **Sharpe ratio** to help users optimize their investment portfolios. It also includes:

- 📰 A **news** section with financial updates  
- ⏰ A **stock market opening/closing time comparator**  
- 💼 A **portfolio optimizer** using the Sharpe ratio


---

### 💰 What is Sharpe Ratio optimization? 

The Sharpe Ratio optimization is a portfolio optimization technique where one has a portfolio of stocks and the fundamental question of "How much money should I allocate to each stock in my portfolio". The Sharpe Ratio optimization answers just this; it takes a set of stocks, a window (days to look within history, normally 252 trading days) and constraints on maximum weighted risk and minimum weighted risk. Firstly, we will define two key terms:

Risk : How much does price fluctuate (measured by volatility which is the standard devitiation of return)

Return : How much profit do we make? 

The Sharpe Ratio itself is defined as ``` Expected Overall Return - Risk-Free Rate / Overall Risk ```, giving us an idea of how much return we get per unit risk. A higher Sharpe Ratio means that we have more reward for the risk we take. This overall optimisation process is finding weights such that the Sharpe Ratio is maximised. The output of the optimizer works on the assumption that daily returns are independant and identically distributed (iid) meaning we can state that ```Annual Sharpe Ratio = Daily Sharpe Ratio * sqrt(252)``` where 252 corresponds to the number of trading days in a year.

## 🛠️ Tech Stack

- **Frontend:** Next.js (TypeScript) + Tailwind CSS  
- **Backend:** Express.js (TypeScript)  
- **Microservice:** Python + FastAPI  
- **Libraries:** `yfinance`, `numpy`, `scipy`, `pandas`, `fastapi`, `uvicorn`, `pydantic`,`Charts.js`
- **APIs:** `marketaux api`

---

## 🚀 Getting Started

### 1. Start the FastAPI Backend

```bash
cd fastapi_backend
python -m venv venv
venv\Scripts\activate  # On Windows
# Or use 'source venv/bin/activate' on Mac/Linux
pip install fastapi uvicorn pydantic yfinance numpy scipy pandas # in addition, make sure to use a market aux api key and replace this in main.py
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

