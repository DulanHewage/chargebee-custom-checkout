<script setup>
import { onMounted, reactive, ref } from "vue";
import Button from "./Button.vue";
import Alert from "./Alert.vue";
import { computed } from "vue";

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
  currency_code: {
    type: String,
    default: "USD",
  },
});
const paymentType = ref("card");
const isLoading = ref(false);
const cardDetails = reactive({
  firstName: undefined,
  lastName: undefined,
  number: undefined,
  expiryMonth: undefined,
  expiryYear: undefined,
  cvv: undefined,
});
const alertStatus = reactive({
  type: undefined,
  msg: undefined,
});
const info = reactive({
  customerName: undefined,
  chargebee_id: undefined,
  transactionID: undefined,
  invoiceID: undefined,
});
const cardNumber = computed(() => {
  return cardDetails.number.replaceAll(/\s/g, "");
});
let cbInstancePayPal;
let cbInstanceCard;
let threeDS;

// create payment intent API call
function createPaymentIntent(options) {
  // create a payment intent
  // call /generate_payment_intent API
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  Object.keys(options).forEach((key) => {
    urlencoded.append(key, options[key]);
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  return fetch(
    "http://localhost:3000/api/generate_payment_intent",
    requestOptions
  )
    .then(function (response) {
      return response.json();
    })
    .then(function (responseJson) {
      return responseJson;
    });
}

function mountPayPalButton() {
  // creates the payment intent for PayPal
  // mounts the PayPal button inside the container element.
  alertStatus.type = undefined;
  alertStatus.msg = undefined;

  cbInstancePayPal.load("paypal").then((paypalHandler) => {
    createPaymentIntent({
      amount: props.amount,
      currency_code: props.currency_code,
      payment_method_type: "paypal_express_checkout",
    })
      .then((payment_intent) => {
        paypalHandler.setPaymentIntent(payment_intent);
        return paypalHandler.mountPaymentButton("#paypal-button", {
          style: {
            shape: "pill",
            color: "blue",
            layout: "vertical",
            label: "paypal",
          },
        });
      })
      .then(() => {
        // once button mounted
        return paypalHandler.handlePayment();
      })
      .then((paymentIntent) => {
        // handle success
        // payment intent status = authorized
        console.log("payment intent", paymentIntent);
        // collect customer details
        const customerDetails = {
          first_name: paymentIntent.payer_info.customer.firstName,
          last_name: paymentIntent.payer_info.customer.lastName,
          email: paymentIntent.payer_info.customer.email,
          payment_intent: paymentIntent,
          payment_method: {
            type: "paypal_express_checkout",
          },
          gateway_account_id: "gw_BTLWOTSyiKGENPbI",
        };
        // create new customer
        createCustomer(customerDetails)
          .then(({ customer }) => {
            alertStatus.type = "success";
            alertStatus.msg = `Payment is ${paymentIntent.status}`;
            console.log("customer created: ", customer);
            // display info
            displayInfo(customer, paymentIntent);
          })
          .catch((error) => {
            console.log("error creating the customer", error);
            alertStatus.type = "error";
            alertStatus.msg = `Failed to create a customer`;
          });
      })
      .catch((error) => {
        console.log("error", error);
        alertStatus.type = "error";
        alertStatus.msg = `Failed to authorize`;
        // handle error
      });
  });
}

function loadCardPayment() {
  cbInstanceCard
    .load3DSHandler()
    .then((threeDSHandler) => {
      threeDS = threeDSHandler;
      return createPaymentIntent({
        amount: props.amount,
        gateway_account_id: "gw_BTcXgiSvoLwKt1a6",
        currency_code: props.currency_code,
      });
    })
    .then((paymentIntent) => {
      if (paymentIntent.error_code) {
        console.error("error creating payment intent");
        console.log(paymentIntent);
      } else {
        // payment intent status = inited
        threeDS.setPaymentIntent(paymentIntent);
      }
    });
}
// create customer API call
function createCustomer(options) {
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  Object.keys(options).forEach((key) => {
    urlencoded.append(key, options[key]);
  });

  const requestOptions = {
    method: "POST",
    headers: myHeaders,
    body: urlencoded,
    redirect: "follow",
  };

  return fetch("http://localhost:3000/api/customer", requestOptions)
    .then(function (response) {
      return response.json();
    })
    .then(function (responseJson) {
      return responseJson;
    });
}

function formSubmitionHandler() {
  if (threeDS === undefined) {
    console.log("cbInstance isn't loaded");
    return;
  }
  alertStatus.type = undefined;
  alertStatus.msg = undefined;
  isLoading.value = true;
  const modifiedCardDetails = {
    ...Object.fromEntries(
      Object.entries(cardDetails).filter(([key]) => key !== "number")
    ),
    number: cardNumber.value,
  };
  console.log("modified card", modifiedCardDetails);
  threeDS
    .handleCardPayment({
      card: modifiedCardDetails,
    })
    .then((paymentIntent) => {
      // payment intent status = authorized
      // create customer
      const customerData = {
        first_name: cardDetails.firstName,
        last_name: cardDetails.lastName,
        card: {
          gateway_account_id: paymentIntent.gateway_account_id,
          first_name: cardDetails.firstName,
          last_name: cardDetails.lastName,
          number: cardNumber.value,
          expiry_month: cardDetails.expiryMonth,
          expiry_year: cardDetails.expiryYear,
          cvv: cardDetails.cvv,
          payment_intent: {
            id: paymentIntent.id,
            gateway_account_id: paymentIntent.gateway_account_id,
            // gw_token: "",
            payment_method_type: paymentIntent.payment_method_type,
          },
        },
      };
      console.log("after submission", paymentIntent);
      console.log("before customerData", customerData);
      console.log("creating new customer...");
      createCustomer(customerData).then(({ customer }) => {
        console.log("customer created", customer);

        console.log(`Payment is ${paymentIntent.status}`);
        alertStatus.type = "success";
        alertStatus.msg = `Payment is ${paymentIntent.status}`;
        isLoading.value = false;
        displayInfo(customer, paymentIntent);
        resetCardDetailsForm();
      });
    })
    .catch((error) => {
      console.log(`Failed to Authorize`, error);
      alertStatus.type = "error";
      alertStatus.msg = `Failed to Authorize`;
      isLoading.value = false;
    });
}

function resetCardDetailsForm() {
  cardDetails.firstName = undefined;
  cardDetails.lastName = undefined;
  cardDetails.number = undefined;
  cardDetails.expiryMonth = undefined;
  cardDetails.expiryYear = undefined;
  cardDetails.cvv = undefined;
}

function resetInfo() {
  info.customerName = undefined;
  info.chargebee_id = undefined;
  info.invoiceID = undefined;
  info.transactionID = undefined;
}

function displayInfo(customer, authorizedPaymentIntent) {
  if (customer.first_name && customer.last_name) {
    info.customerName = `${customer.first_name} ${customer.last_name}`;
  } else if (customer.first_name) {
    info.customerName = customer.first_name;
  } else {
    info.customerName = customer.last_name;
  }
  info.chargebee_id = customer.id;
  info.invoiceID = undefined;
  info.transactionID = authorizedPaymentIntent.id;
}

function paymentTypeSelectHandler() {
  alertStatus.type = undefined;
  alertStatus.msg = undefined;
  resetInfo();
}

onMounted(() => {
  // create chargebee instances
  // eslint-disable-next-line no-undef
  cbInstanceCard = Chargebee.init({
    site: "poliigon-test",
    publishableKey: "test_hJdA7C4QBzAdoAjzCpw0ZI6lo7ONkCaA",
    // publishableKey: "test_cdDdio6tN9ZymCiKzP2ZgC8z6AUHbZEv",
  });
  // eslint-disable-next-line no-undef
  cbInstancePayPal = Chargebee.init({
    site: "poliigon-test",
    publishableKey: "test_hJdA7C4QBzAdoAjzCpw0ZI6lo7ONkCaA",
    // publishableKey: "test_cdDdio6tN9ZymCiKzP2ZgC8z6AUHbZEv",
  });
  // mountPayPalButton();
  // loadCardPayment();
});
</script>

<template>
  <div class="payment-form-wrapper">
    <div class="headline">Select a payment method</div>
    <div class="card-section">
      <div class="radio-btn d-flex align-items-center">
        <input
          type="radio"
          name="payment_type"
          v-model="paymentType"
          value="card"
          id="payment_type_card"
          @change="paymentTypeSelectHandler"
        />
        <label class="label" for="payment_type_card"
          >Credit or debit card</label
        >
      </div>
      <div class="card-section-body" v-show="paymentType === 'card'">
        <form class="form-group">
          <div
            class="form-row d-flex align-items-center justify-content-between"
          >
            <div class="form-input">
              <div class="label">First Name</div>
              <input
                type="text"
                name="firstname"
                placeholder="John"
                v-model="cardDetails.firstName"
              />
            </div>
            <div class="form-input">
              <div class="label">Last Name</div>
              <input
                type="text"
                name="lastname"
                placeholder="Doe"
                v-model="cardDetails.lastName"
              />
            </div>
          </div>
          <div
            class="form-row d-flex align-items-center justify-content-between"
          >
            <div class="form-input">
              <div class="label">Card Number</div>
              <input
                type="text"
                name="number"
                placeholder="4111 1111 1111 1111"
                v-model="cardDetails.number"
              />
            </div>
            <div class="form-input">
              <div class="label">Expiration Date</div>
              <div class="d-flex">
                <input
                  type="text"
                  name="expiryMonth"
                  class="mr-4"
                  placeholder="MM"
                  v-model="cardDetails.expiryMonth"
                />
                <input
                  type="text"
                  name="expiryYear"
                  placeholder="YYYY"
                  v-model="cardDetails.expiryYear"
                />
              </div>
            </div>
          </div>
          <div
            class="form-row d-flex align-items-center justify-content-between"
          >
            <div class="form-input">
              <div class="label">CVV</div>
              <input
                type="text"
                name="cvv"
                placeholder="CVV"
                v-model="cardDetails.cvv"
              />
            </div>
            <div class="form-input">
              <div class="label">Post Code</div>
              <input type="text" name="postcode" placeholder="Post Code" />
            </div>
          </div>
        </form>
        <Button
          @click="formSubmitionHandler"
          class="mt-16 mb-8"
          :loading="isLoading"
          >Checkout Securely</Button
        >
      </div>
    </div>
    <div class="paypal-section">
      <div class="radio-btn d-flex align-items-center">
        <input
          type="radio"
          name="payment_type"
          v-model="paymentType"
          value="paypal"
          id="payment_type_paypal"
          @change="paymentTypeSelectHandler"
        />
        <label class="label" for="payment_type_paypal">Pay with PayPal</label>
      </div>
      <div class="paypal-section-body" v-show="paymentType === 'paypal'">
        <div id="paypal-button" class="mt-8"></div>
      </div>
    </div>
    <Alert
      :error="alertStatus.type === 'error'"
      :success="alertStatus.type === 'success'"
      v-if="alertStatus.type"
      >{{ alertStatus.msg }}</Alert
    >
    <div class="info py-4">
      <p>
        <span class="font-weight-bold" v-if="info.customerName">
          Customer name: </span
        >{{ info.customerName }}
      </p>
      <p>
        <span class="font-weight-bold" v-if="info.chargebee_id">
          Customer chargebee_id: </span
        >{{ info.chargebee_id }}
      </p>
      <p>
        <span class="font-weight-bold" v-if="info.transactionID">
          Transaction ID: </span
        >{{ info.transactionID }}
      </p>
      <p>
        <span class="font-weight-bold" v-if="info.invoiceID">Invoice ID: </span
        >{{ info.invoiceID }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.payment-form-wrapper {
  width: 640px;
  padding: 24px 24px;
  background-color: #fff;
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border-radius: 6px;
  font-size: 1.25rem;
  color: #212529;
  .radio-btn {
    input {
      margin-right: 8px;
    }
    .label {
      font-size: 1.12rem;
    }
  }
  .form-group {
    .form-row {
      margin-top: 8px;
      .form-input {
        width: 100%;
        &:first-child {
          margin-right: 8px;
        }
        &:last-child {
          margin-left: 8px;
        }
        .label {
          font-size: 1rem;
          font-weight: 600;
          margin-right: 8px;
        }
        input {
          height: 32px;
          width: 100%;
          border: 1px solid #ccc;
          padding: 8px 4px;
          border-radius: 4px;
          &:focus {
            outline: none;
            border: 1px solid #212529;
          }
        }
      }
    }
  }
}
</style>
