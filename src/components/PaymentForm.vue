<script setup>
import { onMounted, reactive, ref, computed } from "vue";
import Button from "./Button.vue";
import Alert from "./Alert.vue";
import useAPI from "../api/useAPI";

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
const alertBag = ref([]);

const cardDetails = reactive({
  firstName: undefined,
  lastName: undefined,
  number: undefined,
  expiryMonth: undefined,
  expiryYear: undefined,
  cvv: undefined,
});
const info = reactive({
  customerName: undefined,
  chargebee_id: undefined,
  transactionID: undefined,
  invoiceID: undefined,
});

const cardNumber = computed(() => {
  return cardDetails.number && cardDetails.number.replaceAll(/\s/g, "");
});

let cbInstancePayPal;
let cbInstanceCard;
let threeDS;

const { createPaymentIntent, createCustomer, createInvoice } = useAPI();

function mountPayPalButton() {
  // creates the payment intent for PayPal
  // mounts the PayPal button inside the container element.
  alertBag.value = [];

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
        // payment intent authorized
        console.log("payment intent", paymentIntent);
        addAlert("success", `Payment is ${paymentIntent.status}`);
        // collect customer details
        const customerDetails = {
          first_name: paymentIntent.payer_info.customer.firstName,
          last_name: paymentIntent.payer_info.customer.lastName,
          email: paymentIntent.payer_info.customer.email,
          payment_intent: {
            id: paymentIntent.id,
            // gateway_account_id: paymentIntent.gateway_account_id,
            // gw_token: "",
            // payment_method_type: paymentIntent.payment_method_type,
          },
          gateway_account_id: "gw_BTLWOTSyiKGENPbI",
        };
        // create new customer
        createCustomer(customerDetails)
          .then(({ customer }) => {
            // new customer created.
            console.log("customer created: ", customer);
            // generate invoice
            const invoiceData = {
              customer_id: customer.id,
              currency_code: "USD",
              // payment_intent: {
              //   id: paymentIntent.id,
              // },
              item_prices: [
                {
                  item_price_id: "hundred-credits",
                  unit_price: paymentIntent.amount,
                },
              ],
            };
            console.log("invoiceData", invoiceData);
            // generates invoice by calling the API
            createInvoice(invoiceData)
              .then(({ invoice }) => {
                console.log("invoice generated", invoice);
                displayInfo(
                  {
                    first_name: customer.first_name,
                    last_name: customer.last_name,
                    id: customer.id,
                  },
                  paymentIntent,
                  invoice
                );
                resetCardDetailsForm();
              })
              .catch((error) => {
                addAlert("error", "Failed to generate an invoice");
                console.error("Failed to generate an invoice", error);
              });
          })
          .catch((error) => {
            console.error("failed to create a customer", error);
            addAlert("error", "Failed to create a customer");
          });
      })
      .catch((error) => {
        console.error("error", error);
        addAlert("error", "Failed to authorize");
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
    })
    .catch((error) => {
      console.error("error", error);
      addAlert("error", "Failed to initiate payment intent");
    });
}

function formSubmitionHandler() {
  if (threeDS === undefined) {
    console.log("cbInstance isn't loaded");
    return;
  }
  alertBag.value = [];
  isLoading.value = true;
  const modifiedCardDetails = {
    ...Object.fromEntries(
      Object.entries(cardDetails).filter(([key]) => key !== "number")
    ),
    number: cardNumber.value,
  };
  threeDS
    .handleCardPayment({
      card: modifiedCardDetails,
    })
    .then((paymentIntent) => {
      // payment intent status = authorized
      // create customer
      const customerPayload = {
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
          billing_country: "LK",
          billing_zip: "10300",
          payment_intent: {
            id: paymentIntent.id,
            gateway_account_id: paymentIntent.gateway_account_id,
            // gw_token: "",
            payment_method_type: paymentIntent.payment_method_type,
          },
        },
      };

      // create new customer
      createCustomer(customerPayload)
        .then(({ customer }) => {
          console.log("customer created", customer);
          addAlert("success", `Payment is ${paymentIntent.status}`);
          // generate invoice
          const invoicePayload = {
            customer_id: customer.id,
            currency_code: "USD",
            payment_intent: {
              id: paymentIntent.id,
              // gateway_account_id: paymentIntent.gateway_account_id,
              // payment_method_type: paymentIntent.payment_method_type,
            },
            item_prices: [
              {
                item_price_id: "hundred-credits",
                unit_price: paymentIntent.amount,
              },
            ],
          };
          console.log("invoicePayload", invoicePayload);
          // generates invoice by calling the API
          createInvoice(invoicePayload)
            .then(({ invoice }) => {
              console.log("invoice generated", invoice);
              isLoading.value = false;
              displayInfo(customer, paymentIntent, invoice);
              resetCardDetailsForm();
            })
            .catch((error) => {
              isLoading.value = false;
              console.error("error generating invoice", error);
              addAlert("error", "Failed to generate an invoice");
            });
        })
        .catch((error) => {
          isLoading.value = false;
          console.error("failed to create a customer", error);
          addAlert("error", "Failed to create a customer");
        });
    })
    .catch((error) => {
      console.log(`Failed to Authorize`, error);
      addAlert("error", "Failed to Authorize");
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

function displayInfo(customer, authorizedPaymentIntent, invoice) {
  if (customer.first_name && customer.last_name) {
    info.customerName = `${customer.first_name} ${customer.last_name}`;
  } else if (customer.first_name) {
    info.customerName = customer.first_name;
  } else {
    info.customerName = customer.last_name;
  }
  info.chargebee_id = customer.id;
  info.invoiceID = invoice.id;
  info.transactionID = authorizedPaymentIntent.id;
}

function paymentTypeSelectHandler() {
  alertBag.value = [];
  resetInfo();
}

function addAlert(type, msg) {
  alertBag.value.push({
    type: type,
    msg: msg,
  });
}
onMounted(() => {
  // create chargebee instances
  const site = import.meta.env.VITE_CHARGEBEE_PUBLISHABLE_SITE;
  const publishableKey = import.meta.env.VITE_CHARGEBEE_KEY;

  // chargebee instance for card payments.
  // eslint-disable-next-line no-undef
  cbInstanceCard = Chargebee.init({
    site: site,
    publishableKey: publishableKey,
  });
  // chargebee instance for paypal payments.
  // eslint-disable-next-line no-undef
  cbInstancePayPal = Chargebee.init({
    site: site,
    publishableKey: publishableKey,
  });
  mountPayPalButton();
  loadCardPayment();
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
        <label
          class="label"
          :class="{ 'font-weight-bold': paymentType === 'card' }"
          for="payment_type_card"
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
        <label
          class="label"
          :class="{ 'font-weight-bold': paymentType === 'paypal' }"
          for="payment_type_paypal"
          >Pay with PayPal</label
        >
      </div>
      <div class="paypal-section-body" v-show="paymentType === 'paypal'">
        <div id="paypal-button" class="mt-8"></div>
      </div>
    </div>
    <Alert
      :error="alert.type === 'error'"
      :success="alert.type === 'success'"
      class="mt-4"
      v-for="(alert, index) in alertBag"
      :key="index"
      >{{ alert.msg }}</Alert
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
