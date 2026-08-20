# Legal Validation - Priority Questions for Your First Real Legal Contact

Ask these FIRST, specifically, by name - don't bury them in "please review
our database generally."

1. **Multi-charge threshold rule**: when a case has multiple charges with
   different maximum sentences, is "use the charge with the longest max
   sentence as the binding threshold" the legally correct approach for
   Section 436A CrPC / Section 479 BNSS eligibility? Is this addressed
   directly in Satender Kumar Antil v. CBI or elsewhere?

2. Is the one-third-for-first-time-offenders rule under BNSS 479 applied
   the same way across all offense categories, or are there category-
   specific exceptions we're missing?

3. For the indigent bond-waiver logic (CrPC 436) - are our four hardship
   indicators (fixed income, property ownership, dependents, months
   stuck post-grant) a reasonable proxy, or is there a more standard
   test courts actually use?

4. **Death/life-imprisonment exclusion**: Section 436A CrPC (and Section
   479 BNSS) excludes offences punishable by death or life imprisonment
   from this specific relief. We've added an `is_death_or_life_offense`
   flag to our offense reference table to enforce this - is a simple
   boolean sufficient, or are there partial/conditional exclusions we're
   missing (e.g. commuted sentences, juvenile exceptions)?

5. **Accused-caused delay exclusion**: the statute excludes any detention
   period caused by delay attributable to the accused from the days-served
   count. We've added a `delay_days_attributable_to_accused` field to
   track this - what's the standard evidentiary basis courts use to
   attribute delay to the accused vs. the system, and who is responsible
   for entering this figure in practice?
