"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./page.module.css";

export default function Home() {
  const initialBudget = 100;
  const [balance, setBalance] = useState(initialBudget);
  const [transactions, setTransactions] = useState([]);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [merchantSuggestions, setMerchantSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

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
    const newTransaction = {
      merchant,
      amount: parseFloat(amount),
      note: note.trim(),
      timestamp: new Date().toISOString()
    };
    setTransactions([...transactions, newTransaction]);
    setBalance(balance - newTransaction.amount);
    setMerchant("");
    setAmount("");
    setNote("");
    setShowSuggestions(false);
    merchantInputRef.current?.focus();
  };

  const handleMerchantChange = (value) => {
    setMerchant(value);

    if (value.trim().length > 0) {
      // Get unique merchants from transaction history
      const uniqueMerchants = [...new Set(transactions.map(t => t.merchant))];
      const filtered = uniqueMerchants.filter(m =>
        m.toLowerCase().includes(value.toLowerCase())
      );
      setMerchantSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMerchant(suggestion);
    setShowSuggestions(false);
    merchantInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddTransaction();
    if (e.key === "Escape") setShowSuggestions(false);
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

  const getTimeOfDayEmoji = (timestamp) => {
    const date = new Date(timestamp);
    const hours = date.getHours();

    if (hours >= 6 && hours < 11) {
      return "🌅"; // Breakfast time
    } else if (hours >= 11 && hours <= 16) {
      return "☀️"; // Lunch time
    } else {
      return "🌙"; // Dinner/Evening time
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });
  };

  const formatEmailBody = () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTransactions = transactions
      .map((t) => {
        const timeEmoji = t.timestamp ? getTimeOfDayEmoji(t.timestamp) : "⏰";
        const timeStr = t.timestamp ? formatTime(t.timestamp) : "";
        let line = `${timeEmoji} ${timeStr}%0D%0A${t.merchant.padEnd(20)} $${t.amount.toFixed(2)}`;
        if (t.note) {
          line += `%0D%0A   Note: ${t.note}`;
        }
        return line;
      })
      .join("%0D%0A%0D%0A");

    const total = transactions.reduce((sum, t) => sum + t.amount, 0);

    return (
      `DAILY EXPENSE SUMMARY%0D%0A` +
      `========================================%0D%0A` +
      `Date: ${currentDate}%0D%0A%0D%0A` +
      `TRANSACTIONS:%0D%0A` +
      `${formattedTransactions}%0D%0A%0D%0A` +
      `========================================%0D%0A` +
      `Total Spent:          $${total.toFixed(2)}%0D%0A` +
      `Remaining Balance:    $${balance.toFixed(2)}%0D%0A` +
      `Starting Budget:      $${initialBudget.toFixed(2)}`
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
        <div className={styles.autocompleteWrapper}>
          <input
            type="text"
            placeholder="Merchant"
            value={merchant}
            onChange={(e) => handleMerchantChange(e.target.value)}
            className={styles.input}
            ref={merchantInputRef}
          />
          {showSuggestions && merchantSuggestions.length > 0 && (
            <ul className={styles.suggestionsList}>
              {merchantSuggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={styles.suggestionItem}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
        />
        <input
          type="text"
          placeholder="Note (optional)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
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
            <div className={styles.transactionContent}>
              <span>
                {t.merchant}: ${t.amount.toFixed(2)}
              </span>
              {t.note && (
                <div className={styles.transactionNote}>{t.note}</div>
              )}
            </div>
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
