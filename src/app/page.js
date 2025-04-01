"use client";

import { useState, useEffect } from "react";
import styles from "./page.module.css";

export default function Home() {
  const initialBudget = 100;
  const [balance, setBalance] = useState(initialBudget);
  const [transactions, setTransactions] = useState([]);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const savedData = localStorage.getItem("expenseTrackerData");
    if (savedData) {
      const { savedBalance, savedTransactions, savedDate } =
        JSON.parse(savedData);
      const currentDate = new Date().toDateString();
      if (savedDate === currentDate) {
        setBalance(savedBalance);
        setTransactions(savedTransactions);
      }
    }
  }, []);

  useEffect(() => {
    const currentDate = new Date().toDateString();
    localStorage.setItem(
      "expenseTrackerData",
      JSON.stringify({
        savedBalance: balance,
        savedTransactions: transactions,
        savedDate: currentDate,
      })
    );
  }, [balance, transactions]);

  const handleAddTransaction = () => {
    if (!merchant || !amount || isNaN(amount) || amount <= 0) return;
    const newTransaction = { merchant, amount: parseFloat(amount) };
    setTransactions([...transactions, newTransaction]);
    setBalance(balance - newTransaction.amount);
    setMerchant("");
    setAmount("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddTransaction();
  };

  const handleDeleteTransaction = (index) => {
    const updatedTransactions = transactions.filter((_, i) => i !== index);
    const updatedBalance = updatedTransactions.reduce(
      (acc, t) => acc - t.amount,
      initialBudget
    );
    setTransactions(updatedTransactions);
    setBalance(updatedBalance);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Expense Tracker</h1>
      <p className={styles.balance}>Balance: ${balance.toFixed(2)}</p>

      <div className={styles.addTransaction}>
        <input
          type="text"
          placeholder="Merchant"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={styles.input}
        />
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
        />
        <button onClick={handleAddTransaction} className={styles.button}>
          Add Transaction
        </button>
      </div>

      <ul className={styles.transactionList}>
        {transactions.map((t, index) => (
          <li key={index} className={styles.transactionItem}>
            <span>
              {t.merchant}: ${t.amount.toFixed(2)}
            </span>
            <button
              onClick={() => handleDeleteTransaction(index)}
              className={styles.deleteButton}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
