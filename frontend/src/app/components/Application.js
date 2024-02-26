"use client"
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import secureLocalStorage from 'react-secure-storage';
import Case1 from './cases/Case1';
import Case2 from './cases/Case2';
import Case3 from './cases/Case3';
import Case4 from './cases/Case4';
import Case5 from './cases/Case5';
import Case6 from './cases/Case6';
import Case0 from './cases/Case0';
import Case7 from './cases/Case7';
import Case8 from './cases/Case8';

const Application = ({ id }) => {
  const [questionData, setQuestionData] = useState(null);
  const [account, setAccount] = useState('');
  let ex = 0;

  useEffect(() => {
    const fetchQuestionData = async () => {
      try {
        const response = await fetch(`http://localhost:3001/questions/${id}`); // Adjust the URL/port as needed
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setQuestionData(data);
      } catch (error) {
        console.error("Failed to fetch question data:", error);
      }
    };

    fetchQuestionData();
    if (secureLocalStorage.getItem("key") != null) {
      setAccount(secureLocalStorage.getItem("key"))
    }
  }, []);
  if (questionData != null) {
    if (account != questionData.address && questionData.selected == "" && questionData.comments.every(obj => obj.value !== account)) {//Case 1, be able to apply
      ex = 1;
    } else if (account != questionData.address && questionData.selected == "" && !questionData.comments.every(obj => obj.value !== account)) {
      ex = 8;
    } else if (account == questionData.address && questionData.selected == "") { //Case 2, see current applications
      ex = 2;
    } else if (questionData.comments != null && questionData.answer.comment == "" && account == questionData.selected) {//Case 3, solve the question
      ex = 3;
    } else if (questionData.selected != "" && (account != questionData.selected && account != questionData.address)) { //Case 4, user got rejected
      ex = 4;
    } else if (questionData.done == false && questionData.answer.comment != "" && questionData.address == account) {
      ex = 5;
    } else if (questionData.done == true && (questionData.address == account || questionData.address == account)) {
      ex = 6;
    } else if (questionData.done == false && questionData.address == account && questionData.selected != "") {
      ex = 7;
    }
  }


  const renderPage = () => {
    switch (ex) {
      case 1:
        return <Case1 id={id} account={account} />;
      case 2:
        return <Case2 id={id} account={account} />;
      case 3:
        return <Case3 id={id} account={account} />;
      case 4:
        return <Case4 id={id} account={account} />;
      case 5:
        return <Case5 id={id} account={account} />;
      case 6:
        return <Case6 id={id} account={account} />;
      case 7:
        return <Case7 id={id} account={account} />;
      case 8:
        return <Case8 />;
      default:
        return <Case0 id={id} account={account} />;
    }
  };


  return (
    <div>
      {renderPage()}
    </div>
  )
}

export default Application