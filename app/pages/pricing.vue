<script setup lang="ts">
const { t, tm } = useI18n()

useSeoMeta({
  title: t('pricing.seo.title'),
  ogTitle: t('pricing.seo.title'),
  description: t('pricing.seo.description'),
  ogDescription: t('pricing.seo.description')
})

// OG image uses static /og-image.png from brand-assets

const isYearly = ref('0')

const items = computed(() => [
  { label: t('pricing.monthly'), value: '0' },
  { label: t('pricing.yearly'), value: '1' }
])

const plans = computed(() => [
  {
    title: t('pricing.plans.basic.title'),
    description: t('pricing.plans.basic.description'),
    price: isYearly.value === '1' ? t('pricing.plans.basic.priceYear') : t('pricing.plans.basic.priceMonth'),
    billingCycle: isYearly.value === '1' ? t('pricing.perYear') : t('pricing.perMonth'),
    button: { label: t('pricing.getStarted'), color: 'neutral' as const, variant: 'subtle' as const },
    features: tm('pricing.plans.basic.features') as string[]
  },
  {
    title: t('pricing.plans.standard.title'),
    description: t('pricing.plans.standard.description'),
    price: isYearly.value === '1' ? t('pricing.plans.standard.priceYear') : t('pricing.plans.standard.priceMonth'),
    billingCycle: isYearly.value === '1' ? t('pricing.perYear') : t('pricing.perMonth'),
    highlight: true,
    scale: true,
    button: { label: t('pricing.getStarted') },
    features: tm('pricing.plans.standard.features') as string[]
  },
  {
    title: t('pricing.plans.premium.title'),
    description: t('pricing.plans.premium.description'),
    price: isYearly.value === '1' ? t('pricing.plans.premium.priceYear') : t('pricing.plans.premium.priceMonth'),
    billingCycle: isYearly.value === '1' ? t('pricing.perYear') : t('pricing.perMonth'),
    button: { label: t('pricing.getStarted'), color: 'neutral' as const, variant: 'subtle' as const },
    features: tm('pricing.plans.premium.features') as string[]
  }
])

const faqItems = computed(() => {
  const items = t('pricing.faq.items') as unknown as Array<{ label: string, content: string }>
  return items
})
</script>

<template>
  <div>
    <UPageHero
      :title="t('pricing.title')"
      :description="t('pricing.description')"
    >
      <template #links>
        <UTabs
          v-model="isYearly"
          :items="items"
          color="neutral"
          size="xs"
          class="w-48"
          :ui="{
            list: 'ring ring-accented rounded-full',
            indicator: 'rounded-full',
            trigger: 'w-1/2'
          }"
        />
      </template>
    </UPageHero>

    <UContainer>
      <UPricingPlans scale>
        <UPricingPlan
          v-for="(plan, index) in plans"
          :key="index"
          v-bind="plan"
        />
      </UPricingPlans>
    </UContainer>

    <UPageSection
      :title="t('pricing.faq.title')"
      :description="t('pricing.faq.description')"
    >
      <UAccordion
        :items="faqItems"
        :unmount-on-hide="false"
        :default-value="['0']"
        type="multiple"
        class="max-w-3xl mx-auto"
        :ui="{
          trigger: 'text-base text-highlighted',
          body: 'text-base text-muted'
        }"
      />
    </UPageSection>
  </div>
</template>
