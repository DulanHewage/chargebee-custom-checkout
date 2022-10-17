<template>
  <header>
    <div class="wrapper d-flex align-items-center justify-content-center">
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
import useAPI from "./api/useAPI";
import { useCustomerStore } from "./stores/customers";

const customerStore = useCustomerStore();
const { retrieveCustomers } = useAPI();

onMounted(() => {
  retrieveCustomers()
    .then((result) => {
      // Sets retrieved customer data to customerStore
      result
        .map((customerObj) => customerObj.customer)
        .forEach((customer) => {
          customerStore.setCustomer(customer);
        });
    })
    .catch((error) => console.error("error", error));
});
</script>

<style lang="scss" scoped>
.wrapper {
  height: 60px;
  nav {
    a {
      font-size: 1.2rem;
      font-weight: bold;
      text-decoration: none;
      margin-right: 16px;
      color: #212529;
      border-bottom-color: transparent;
      border-bottom-width: 1px;
      border-bottom-style: solid;
      &:last-child {
        margin-right: 0;
      }
      &.router-link-active {
        border-bottom-color: #212529;
      }
    }
  }
}
</style>
