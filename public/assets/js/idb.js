// create variable to hole db connection
let db;

// establish a connection to IndexedDB called 'pizza_hunt', set to version 1
const request = indexedDB.open('pizza_hunt', 1);

// this will emit if the database version changes
request.onupgradeneeded = function (event) {
  // save a reference to the database
  const db = event.target.result;
  // create an object store called 'new_pizza', set autoIncrement
  db.createObjectStore('new_pizza', { autoIncrement: true });
};

// if successful
request.onsuccess = function (event) {
  // when db is successfully created with object store, save reference to db in global variable
  db = event.target.result;

  // check if app is online
  if (navigator.onLine) {
    uploadPizza();
  }
};

request.onerror = function (event) {
  // log error
  console.log(event.target.errorCode);
};

// this will execute if we submit new pizza with no internet
function saveRecord(record) {
  // open new transaction with database with read/write permission
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  // access the object store for 'new_pizza'
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  // add record to your store with add method
  pizzaObjectStore.add(record);
}

function uploadPizza() {
  // open transaction on you db
  const transaction = db.transaction(['new_pizza'], 'readwrite');

  // access your object store
  const pizzaObjectStore = transaction.objectStore('new_pizza');

  // get all records from store and set to variable
  const getAll = pizzaObjectStore.getAll();

  getAll.onsuccess = function () {
    // if there was data in indexedDB's store, send it to the api server
    if (getAll.result.length > 0) {
      fetch('/api/pizzas', {
        method: 'POST',
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Content-Type': 'application/json',
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          // open one more transaction
          const transaction = db.transaction(['new_pizza'], 'readwrite');
          // access new_pizza object store
          const pizzaObjectStore = transaction.objectStore('new_pizza');
          // clear all items in your store
          pizzaObjectStore.clear();

          alert('All saved pizza has been submitted!');
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

// listen for app coming back online
window.addEventListener('online', uploadPizza);
