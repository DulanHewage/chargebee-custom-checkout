<template>
  <div class="about container">
    <h1 class="text-center headline">Customers</h1>
    <div class="d-flex justify-content-between">
      <div class="create-customer">create customer</div>
      <div class="customer-list" v-if="customerStore.customers.length > 0">
        <CustomerCard
          v-for="customer in customerStore.customers"
          :key="customer.id"
          :customer="customer"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import CustomerCard from "../components/CustomerCard.vue";
import { useCustomerStore } from "../stores/customers";

const customerStore = useCustomerStore();
</script>
