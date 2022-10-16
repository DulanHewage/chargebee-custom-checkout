<script setup>
import PaymentForm from "../components/PaymentForm.vue";
</script>

<template>
  <main>
    <div class="container">
      <div class="d-flex justify-content-center">
        <PaymentForm :amount="100" />
      </div>
    </div>
  </main>
</template>
