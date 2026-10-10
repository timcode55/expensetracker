"use client";

import { useState, useEffect, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "./page.module.css";

const INITIAL_BUDGET = 100;
const HISTORY_KEY = "expenseTrackerHistory";
const LEGACY_KEY = "expenseTrackerData";
const DAYS_TO_KEEP = 30;
const QUICK_MERCHANTS = ["Whole Foods", "ShopRite", "Weis", "Dunkin'"];
const MAX_SUGGESTIONS = 5;

// Local-time YYYY-MM-DD, so days roll over at local midnight
const toDateKey = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const fromDateKey = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
};

const loadHistory = () => {
  let history = {};
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || {};

    // Migrate the old single-day format
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY));
    if (legacy?.savedTransactions?.length) {
      const key = toDateKey(new Date(legacy.savedDate));
      if (!history[key]) history[key] = legacy.savedTransactions;
    }
  } catch {
    // Corrupt data: start fresh rather than crash
  }

  // Keep the most recent days only, and make sure every entry has an id
  const kept = Object.keys(history).sort().slice(-DAYS_TO_KEEP);
  return Object.fromEntries(
    kept.map((key) => [
      key,
      history[key].map((t) => ({ ...t, id: t.id || uuidv4() })),
    ])
  );
};

export default function Home() {
  const [history, setHistory] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [today, setToday] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [merchantSuggestions, setMerchantSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ merchant: "", amount: "", note: "" });

  const merchantInputRef = useRef(null);
  const amountInputRef = useRef(null);

  useEffect(() => {
    document.title = "Meal Expense Daily Tracker";
  }, []);

  useEffect(() => {
    const todayKey = toDateKey(new Date());
    setHistory(loadHistory());
    setToday(todayKey);
    setSelectedDate(todayKey);
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    localStorage.removeItem(LEGACY_KEY);
  }, [history, loaded]);

  // If the tab was left open overnight, move on to the new day when it's reopened
  useEffect(() => {
    const checkForNewDay = () => {
      const todayKey = toDateKey(new Date());
      setToday((prevToday) => {
        if (prevToday && prevToday !== todayKey) {
          setSelectedDate((prevSelected) =>
            prevSelected === prevToday ? todayKey : prevSelected
          );
        }
        return todayKey;
      });
    };
    document.addEventListener("visibilitychange", checkForNewDay);
    window.addEventListener("focus", checkForNewDay);
    return () => {
      document.removeEventListener("visibilitychange", checkForNewDay);
      window.removeEventListener("focus", checkForNewDay);
    };
  }, []);

  const transactions = history[selectedDate] || [];
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
  const balance = INITIAL_BUDGET - totalSpent;
  const isToday = selectedDate === today;

  // Days with entries, plus today and the day being viewed
  const days = [
    ...new Set([
      ...Object.keys(history).filter((k) => history[k].length > 0),
      today,
      selectedDate,
    ]),
  ].sort();
  const dayIndex = days.indexOf(selectedDate);
  const prevDay = dayIndex > 0 ? days[dayIndex - 1] : null;
  const nextDay = dayIndex < days.length - 1 ? days[dayIndex + 1] : null;

  const updateDay = (dateKey, update) => {
    setHistory((prev) => {
      const updated = update(prev[dateKey] || []);
      const next = { ...prev };
      if (updated.length > 0) next[dateKey] = updated;
      else delete next[dateKey];
      return next;
    });
  };

  const goToDay = (dateKey) => {
    setSelectedDate(dateKey);
    setEditingId(null);
  };

  const handleAddTransaction = () => {
    if (!merchant || !amount || isNaN(amount) || amount <= 0) return;

    // Entries added to a past day get that day's date with the current time
    const timestamp = new Date();
    if (!isToday) {
      const day = fromDateKey(selectedDate);
      timestamp.setFullYear(day.getFullYear(), day.getMonth(), day.getDate());
    }

    const newTransaction = {
      id: uuidv4(),
      merchant: merchant.trim(),
      amount: parseFloat(amount),
      note: note.trim(),
      timestamp: timestamp.toISOString(),
    };
    updateDay(selectedDate, (list) => [...list, newTransaction]);
    setMerchant("");
    setAmount("");
    setNote("");
    setShowSuggestions(false);
    merchantInputRef.current?.focus();
  };

  const handleMerchantChange = (value) => {
    setMerchant(value);

    const query = value.trim().toLowerCase();
    if (query.length > 0) {
      // Count how often each merchant was used across all saved days
      const counts = {};
      QUICK_MERCHANTS.forEach((m) => (counts[m] = 0));
      Object.values(history)
        .flat()
        .forEach((t) => (counts[t.merchant] = (counts[t.merchant] || 0) + 1));

      // Names starting with the query first, then most used, then alphabetical
      const filtered = Object.keys(counts)
        .filter((m) => m.toLowerCase().includes(query))
        .sort((a, b) => {
          const aStarts = a.toLowerCase().startsWith(query);
          const bStarts = b.toLowerCase().startsWith(query);
          if (aStarts !== bStarts) return aStarts ? -1 : 1;
          if (counts[a] !== counts[b]) return counts[b] - counts[a];
          return a.localeCompare(b);
        })
        .slice(0, MAX_SUGGESTIONS);
      setMerchantSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
      setHighlightedIndex(0);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMerchant(suggestion);
    setShowSuggestions(false);
    amountInputRef.current?.focus();
  };

  const handleMerchantKeyDown = (e) => {
    const suggestionsOpen = showSuggestions && merchantSuggestions.length > 0;

    if (e.key === "ArrowDown" && suggestionsOpen) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.min(i + 1, merchantSuggestions.length - 1));
    } else if (e.key === "ArrowUp" && suggestionsOpen) {
      e.preventDefault();
      setHighlightedIndex((i) => Math.max(i - 1, 0));
    } else if ((e.key === "Enter" || e.key === "Tab") && suggestionsOpen) {
      e.preventDefault();
      handleSuggestionClick(merchantSuggestions[highlightedIndex]);
    } else if (e.key === "Enter" && merchant.trim()) {
      amountInputRef.current?.focus();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  const handleQuickMerchant = (name) => {
    setMerchant(name);
    setShowSuggestions(false);
    amountInputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleAddTransaction();
    if (e.key === "Escape") setShowSuggestions(false);
  };

  const handleDeleteTransaction = (id) => {
    updateDay(selectedDate, (list) => list.filter((t) => t.id !== id));
  };

  const startEditing = (t) => {
    setEditingId(t.id);
    setEditDraft({ merchant: t.merchant, amount: String(t.amount), note: t.note || "" });
  };

  const saveEdit = () => {
    const { merchant: m, amount: a, note: n } = editDraft;
    if (!m.trim() || !a || isNaN(a) || a <= 0) return;
    updateDay(selectedDate, (list) =>
      list.map((t) =>
        t.id === editingId
          ? { ...t, merchant: m.trim(), amount: parseFloat(a), note: n.trim() }
          : t
      )
    );
    setEditingId(null);
  };

  const handleEditKeyDown = (e) => {
    if (e.key === "Enter") saveEdit();
    if (e.key === "Escape") setEditingId(null);
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
      hour12: true,
    });
  };

  const formatEmailBody = () => {
    const reportDate = fromDateKey(selectedDate).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedTransactions = transactions
      .map((t) => {
        const timeEmoji = t.timestamp ? getTimeOfDayEmoji(t.timestamp) : "⏰";
        const timeStr = t.timestamp ? formatTime(t.timestamp) : "";
        let line = `${timeEmoji} ${timeStr}\n${t.merchant.padEnd(20)} $${t.amount.toFixed(2)}`;
        if (t.note) {
          line += `\n   Note: ${t.note}`;
        }
        return line;
      })
      .join("\n\n");

    return (
      `DAILY EXPENSE SUMMARY\n` +
      `========================================\n` +
      `Date: ${reportDate}\n\n` +
      `TRANSACTIONS:\n` +
      `${formattedTransactions}\n\n` +
      `========================================\n` +
      `Total Spent:          $${totalSpent.toFixed(2)}\n` +
      `Remaining Balance:    $${balance.toFixed(2)}\n` +
      `Starting Budget:      $${INITIAL_BUDGET.toFixed(2)}`
    );
  };

  if (!loaded) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Meal Expense Tracker</h1>
      </div>
    );
  }

  const selectedDateLabel = fromDateKey(selectedDate).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const emailSubject = `Meal Expense Report - ${fromDateKey(selectedDate).toLocaleDateString(
    "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  )}`;
  const emailLink = `mailto:?subject=${encodeURIComponent(
    emailSubject
  )}&body=${encodeURIComponent(formatEmailBody())}`;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Meal Expense Tracker</h1>

      <div className={styles.dayNav}>
        <button
          onClick={() => goToDay(prevDay)}
          disabled={!prevDay}
          className={styles.dayNavButton}
          aria-label="Previous day"
        >
          ‹
        </button>
        <span className={styles.dayLabel}>
          {isToday ? `Today · ${selectedDateLabel}` : selectedDateLabel}
        </span>
        <button
          onClick={() => goToDay(nextDay)}
          disabled={!nextDay}
          className={styles.dayNavButton}
          aria-label="Next day"
        >
          ›
        </button>
      </div>
      {!isToday && (
        <button onClick={() => goToDay(today)} className={styles.backToToday}>
          Back to today
        </button>
      )}

      <p className={styles.balance}>Balance: ${balance.toFixed(2)}</p>

      <div className={styles.addTransaction}>
        <div className={styles.quickMerchants}>
          {QUICK_MERCHANTS.map((name) => (
            <button
              key={name}
              onClick={() => handleQuickMerchant(name)}
              className={`${styles.quickMerchant} ${
                merchant === name ? styles.quickMerchantActive : ""
              }`}
            >
              {name}
            </button>
          ))}
        </div>
        <div className={styles.autocompleteWrapper}>
          <input
            type="text"
            placeholder="Merchant"
            value={merchant}
            onChange={(e) => handleMerchantChange(e.target.value)}
            onKeyDown={handleMerchantKeyDown}
            onBlur={() => setShowSuggestions(false)}
            className={styles.input}
            ref={merchantInputRef}
          />
          {showSuggestions && merchantSuggestions.length > 0 && (
            <ul className={styles.suggestionsList}>
              {merchantSuggestions.map((suggestion, index) => (
                <li
                  key={suggestion}
                  // mousedown fires before the input's blur closes the list
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSuggestionClick(suggestion);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`${styles.suggestionItem} ${
                    index === highlightedIndex ? styles.suggestionItemActive : ""
                  }`}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="number"
          inputMode="decimal"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.input}
          ref={amountInputRef}
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
        {transactions.map((t) =>
          editingId === t.id ? (
            <li key={t.id} className={`${styles.transactionItem} ${styles.editing}`}>
              <input
                type="text"
                value={editDraft.merchant}
                onChange={(e) => setEditDraft({ ...editDraft, merchant: e.target.value })}
                onKeyDown={handleEditKeyDown}
                className={styles.input}
                placeholder="Merchant"
                autoFocus
              />
              <input
                type="number"
                inputMode="decimal"
                value={editDraft.amount}
                onChange={(e) => setEditDraft({ ...editDraft, amount: e.target.value })}
                onKeyDown={handleEditKeyDown}
                className={styles.input}
                placeholder="Amount"
              />
              <input
                type="text"
                value={editDraft.note}
                onChange={(e) => setEditDraft({ ...editDraft, note: e.target.value })}
                onKeyDown={handleEditKeyDown}
                className={styles.input}
                placeholder="Note (optional)"
              />
              <div className={styles.editActions}>
                <button onClick={saveEdit} className={styles.saveButton}>
                  Save
                </button>
                <button onClick={() => setEditingId(null)} className={styles.cancelButton}>
                  Cancel
                </button>
              </div>
            </li>
          ) : (
            <li key={t.id} className={styles.transactionItem}>
              <div className={styles.transactionContent}>
                <span>
                  {t.merchant}: ${t.amount.toFixed(2)}
                </span>
                {t.note && <div className={styles.transactionNote}>{t.note}</div>}
              </div>
              <div className={styles.itemActions}>
                <button onClick={() => startEditing(t)} className={styles.editButton}>
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteTransaction(t.id)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </li>
          )
        )}
      </ul>

      {transactions.length > 0 && (
        <a href={emailLink} className={styles.emailButton}>
          {isToday ? "Email Today's Expenses" : `Email ${selectedDateLabel} Expenses`}
        </a>
      )}
    </div>
  );
}
