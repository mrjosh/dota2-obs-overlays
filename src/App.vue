<template>
  <div class="container">
    <notifications group="main" position="top center" />
    <transition name="router-animation"
      enter-active-class="animated fadeIn"
      leave-active-class="animated fadeOut"
      mode="out-in">
      <router-view name="main"
        style="animation-duration: 0.3s !important;" />
    </transition>
  </div>
</template>

<script>

  import "animate.css/animate.min.css";

  export default {
    name: "Application",
  }

</script>
