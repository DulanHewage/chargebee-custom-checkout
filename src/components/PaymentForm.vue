<script setup>
import { nextTick, onMounted, ref } from "vue";

const props = defineProps({
  amount: {
    type: Number,
    required: true,
  },
});

const paymentType = ref("card");

let cbInstance;

function createPaymentIntent(options) {
  // create a payment intent
  // call /generate_payment_intent API
  const myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/x-www-form-urlencoded");

  const urlencoded = new URLSearchParams();
  urlencoded.append("amount", options.amount);
  urlencoded.append("currency_code", options.currency_code);
  urlencoded.append("payment_method_type", options.payment_method_type);

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
  cbInstance.load("paypal").then((paypalHandler) => {
    createPaymentIntent({
      amount: 100,
      currency_code: "USD",
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
        console.log("success", paymentIntent);
      })
      .catch((error) => {
        console.log("error", error);
        // handle error
      });
  });
}

onMounted(() => {
  nextTick(() => {
    // create chargebee instance
    // eslint-disable-next-line no-undef
    cbInstance = Chargebee.init({
      site: "poliigon-test",
      publishableKey: "test_hJdA7C4QBzAdoAjzCpw0ZI6lo7ONkCaA",
    });
  });
});
</script>

<template>
  <div class="payment-form-wrapper">
    <h1>{{ msg }}</h1>
    <input
      type="radio"
      name="payment_type"
      v-model="paymentType"
      value="card"
    />
    <input
      type="radio"
      name="payment_type"
      v-model="paymentType"
      value="paypal"
    />
    <div class="card-section" v-show="paymentType === 'card'">card</div>
    <div class="paypal-section" v-show="paymentType === 'paypal'">
      <div id="paypal-button"></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.payment-form-wrapper {
  h1 {
    color: red;
  }
}
</style>
