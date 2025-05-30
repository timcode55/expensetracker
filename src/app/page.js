"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function Home() {
  const initialBudget = 100;
  const [balance, setBalance] = useState(initialBudget);
  const [transactions, setTransactions] = useState([]);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");

  const merchantInputRef = useRef(null);

  useEffect(() => {
    document.title = "Meal Expense Daily Tracker";
  }, []);

  useEffect(() => {
    const savedData = localStorage.getItem("expenseTrackerData");
    const currentDate = new Date().toDateString();

    if (savedData) {
      const { savedBalance, savedTransactions, savedDate } =
        JSON.parse(savedData);
      if (savedDate === currentDate) {
        setBalance(savedBalance);
        setTransactions(savedTransactions);
      } else {
        setBalance(initialBudget);
        setTransactions([]);
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
    merchantInputRef.current?.focus();
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

  const formatEmailBody = () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTransactions = transactions
      .map((t) => `${t.merchant.padEnd(16)} $${t.amount.toFixed(2)}`)
      .join("%0D%0A");

    return (
      `📅 Daily Expense Summary%0D%0A` +
      `Date: ${currentDate}%0D%0A%0D%0A` +
      `Merchant         Amount%0D%0A` +
      `------------------------%0D%0A` +
      `${formattedTransactions}%0D%0A%0D%0A` +
      `Remaining Balance: $${balance.toFixed(2)}`
    );
  };

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const emailSubject = `Meal Expense Report - ${currentDate}`;
  const emailLink = `mailto:?subject=${encodeURIComponent(
    emailSubject
  )}&body=${formatEmailBody()}`;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Meal Expense Tracker</h1>
      <p className={styles.balance}>Balance: ${balance.toFixed(2)}</p>

      <div className={styles.addTransaction}>
        <input
          type="text"
          placeholder="Merchant"
          value={merchant}
          onChange={(e) => setMerchant(e.target.value)}
          className={styles.input}
          ref={merchantInputRef}
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

      {transactions.length > 0 && (
        <a href={emailLink} className={styles.emailButton}>
          {"Email Today's Expenses"}
        </a>
      )}
    </div>
  );
}
