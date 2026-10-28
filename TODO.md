# TODO

- Configure settings to exclude necessary file watching for dotnet application so my disk space does get all eaten up
- Frontend side drawer CSS needs tweeking and to be collapsible
- Overall general review of the code to makeß sure the arch and org is good 
- BUG: All of the accounts on the account page are quadlicated (there are 4 of each)
- TASK: Show account column in the transactions 
- STORY: Support different types of accounts such as credit/debit card, venmo, savings (401k), HYSA, brokerage, HYSA
- STORY: Show account overview with different balances in each account
- STORY: Plaid category confidence. 
  - If the plaidCategoryConfidence is low level than flag the transaction for me to assign the cateogry, from the list of categories. If it is higher level then automatically set the cateogry. This shouldn't be a requirement to do but default to the plaid one
  - Allow filtering for ease of use 
- TASK: Set the default budget percentages to the recommended if the recommended hasn't been overrided. Make each month show that if it has been set from the budget defaults or not.
- STORY: Make the app mirror the API a little bit closer. So show a better overview of net worth, transaction totals, etc
- STORY: Show wealth perjection over time in a new tab to estimate how much money you will have at a specific time if you continue on the current reate. ß
- STORY: Provide auth for signing into the account. There will only be one admin user who should set the admin user password on account creation. The user will then change the password only via the database. Document this. 

## Key

BUG = Something to Fix
TASK = Something small to add/improve
STORY = A new feature to add that isn't currently represented
EPIC = A large feature to add that is a substantial effore