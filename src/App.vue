<template>
  <header>
    <div class="wrapper">
      <nav>
        <RouterLink to="/">Home</RouterLink>
        <RouterLink to="/customers">Customers</RouterLink>
      </nav>
    </div>
  </header>

  <RouterView />
</template>

<script setup>
import { RouterLink, RouterView } from "vue-router";
import { onMounted } from "vue";
import { useCustomerStore } from "../src/stores/customers";

const customerStore = useCustomerStore();

function retrieveCustomers() {
  // Retrieves a list of customers from Chargebee
  // Fetches data from API (/customers)
  const requestOptions = {
    method: "GET",
    redirect: "follow",
  };

  fetch("http://localhost:3000/api/customer/list", requestOptions)
    .then((response) => response.json())
    .then((result) => {
      // Sets retrieved customer data to customerStore
      result
        .map((customerObj) => customerObj.customer)
        .forEach((customer) => {
          customerStore.setCustomer(customer);
        });
    })
    .catch((error) => console.log("error", error));
}

onMounted(() => {
  retrieveCustomers();
});
</script>
