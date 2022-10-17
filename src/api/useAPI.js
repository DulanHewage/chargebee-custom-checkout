export default function useAPI() {
  const uri = "http://localhost:3000/api";

  // creates a payment intent
  function createPaymentIntent(options) {
    // calls /generate_payment_intent API
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(options),
      redirect: "follow",
    };

    return fetch(`${uri}/generate_payment_intent`, requestOptions)
      .then(function (response) {
        return response.json();
      })
      .then(function (responseJson) {
        return responseJson;
      });
  }

  // creates a customer
  function createCustomer(options) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(options),
      redirect: "follow",
    };

    return fetch(`${uri}/customer`, requestOptions)
      .then(function (response) {
        return response.json();
      })
      .then(function (responseJson) {
        return responseJson;
      });
  }

  // retrieves a list of customers from Chargebee
  function retrieveCustomers() {
    // Fetches data from API (/customers)
    const requestOptions = {
      method: "GET",
      redirect: "follow",
    };

    return fetch(`${uri}/customer/list`, requestOptions)
      .then((response) => {
        return response.json();
      })
      .then((result) => {
        return result;
      });
  }

  // creates an invoice
  function createInvoice(options) {
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: JSON.stringify(options),
      redirect: "follow",
    };

    return fetch(`${uri}/create_invoice`, requestOptions)
      .then(function (response) {
        return response.json();
      })
      .then(function (responseJson) {
        return responseJson;
      });
  }

  return {
    createPaymentIntent,
    createCustomer,
    createInvoice,
    retrieveCustomers,
  };
}
