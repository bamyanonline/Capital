# CAPITAL — Final Financial Rules & Implementation Specification

## 1. Identity
- Every user has one immutable unique ID.
- Format: `CAPXXXXX` — `CAP` plus exactly 5 uppercase letters/numbers.
- The same value is the user's User ID and Referral Code.
- Referral input accepts an existing active user's CAPXXXXX.
- The ID is generated server-side and is never user-editable.

## 2. Investment Plans
| VIP | Original Investment | Fixed Daily Profit |
|---|---:|---:|
| VIP1 | 100 USDT | 1.10 USDT |
| VIP2 | 200 USDT | 2.40 USDT |
| VIP3 | 300 USDT | 3.90 USDT |
| VIP4 | 400 USDT | 5.60 USDT |
| VIP5 | 500 USDT | 7.50 USDT |

- Only these five exact deposit amounts are valid.
- A user may have only one investment.
- A rejected deposit may be corrected/resubmitted by reusing the same deposit record; a second independent deposit is not created.
- Deposit approval activates the matching VIP automatically.
- No compound interest exists. Daily profit is always calculated from the original approved investment.
- The original investment is never increased by accumulated profits.

## 3. VIP UI State
- After Admin approval, the matching VIP becomes light-green and disabled.
- All other VIP buttons become gray and disabled.
- VIP cannot be activated manually through a separate activation endpoint.

## 4. Deposit Timing — Afghanistan Time
Financial timezone: `Asia/Kabul`.

- Deposit time, not Admin approval time, determines whether the deposit qualifies for same-day treatment.
- Deposit before 16:00:
  - If approved on the same Afghanistan calendar day, that day's fixed daily profit is credited once as the initial same-day profit event.
  - If approved on a later day, no retroactive profit is created for days already elapsed; the first new daily profit begins on the next Afghanistan financial day at 00:00 after approval.
- Deposit after 16:00:
  - No daily profit is paid for the deposit day, even if Admin approves it that same day.
  - First daily profit starts on the following Afghanistan financial day at 00:00.
- Later daily profits are posted once per financial day at 00:00 Afghanistan time.

## 5. Daily Profit
- Fixed amounts from the VIP table are used.
- Daily profit never uses Available Balance, accumulated profit, or a compounded principal.
- A stopped period is not back-paid.
- A user who becomes eligible again starts receiving new daily profit from the defined next 00:00; missed days are permanently missed.

## 6. Direct Team Profit
- Only direct referrals generate Team Profit.
- Indirect referrals generate no Team Profit.
- Rate: `0.1% per financial day` of each eligible direct referral's approved original investment.
- The user's own investment is not included in Team Profit.
- A direct member must have an approved investment and an active account for Team Profit to accrue to the inviter.
- A direct member's own withdrawal-cap/profit-stop state does not erase the inviter's Team Profit entitlement; account status and investment eligibility do.
- For a newly approved direct member, Team Profit begins on the member's applicable first team-profit financial day under the same deposit-time rule.

## 7. Referral Bonus
- The direct inviter receives `5%` of the invitee's approved original investment.
- The invitee receives `0%` Referral Bonus.
- The bonus is credited immediately when Admin approves the invitee's deposit.
- Referral Bonus remains independent of the inviter's Daily Profit/Team Profit pause.
- If the invitee is deleted before 30 calendar days have elapsed from the relevant account/investment start, the full 5% bonus is reversed from the inviter's Available Balance.
- If deletion occurs after 30 days, the 5% bonus is not reversed.

## 8. Team Membership Removal
- Before 30 days: the invitee's Team Profit contribution remains through the deletion day and stops from the next day; the 5% Referral Bonus is reversed.
- After 30 days: Team Profit stops when the account is removed; the 5% Referral Bonus remains.
- Removed/deleted capital no longer counts toward Direct Team Capital.

## 9. Balance Model
- `Original Investment` is the fixed principal used for all plan/profit/cap calculations.
- `Available Balance` is the spendable profit-side balance and can become negative.
- `Balance` is the accounting total: original investment + net credited profits/bonuses/reversals - approved withdrawals.
- Daily Profit, Team Profit and Referral Bonus increase Available Balance and Balance.
- Referral reversal decreases Available Balance and Balance.
- Approved withdrawals decrease Available Balance and Balance.
- Original investment itself is not withdrawable through Available Balance.

## 10. Negative Available Balance
- Available Balance may become negative, for example after a pre-30-day Referral Bonus reversal.
- Every new income is posted in actual creation timestamp order.
- Each new income first offsets the existing negative Available Balance.
- If the income is larger than the negative amount, the remainder becomes positive Available Balance.
- No income type has priority over another; timestamp/order of creation is the rule.

## 11. Final Withdrawal-Cap Rule
For every user with original investment `P`:

`Team Threshold = P × 3`

- If `Direct Team Capital < P × 3`: the user is in `LIMITED_100`.
- If `Direct Team Capital >= P × 3`: the user is in `NO_CAP`.
- Number of referrals is not the criterion; Direct Team Capital is the criterion.
- In `LIMITED_100`, the current withdrawal cycle cap is `100% × P`.
- Only new withdrawals in the current limited cycle count toward that cycle's cap.
- Previous withdrawals from an earlier cap cycle are not retroactively counted against a new limited cycle.

### Example — 500 USDT principal
- Team 1499 → Limited 100%, cap = 500 USDT.
- Team 1500 → No Cap.

## 12. Reaching the 100% Cap
When the user fully consumes the current limited-cycle cap:
- Daily Profit stops.
- Team Profit stops.
- New withdrawals are blocked.
- No missed profit is accumulated for later payment.

## 13. Returning to No Cap
When Direct Team Capital reaches at least `Original Investment × 3` again:
- The user becomes eligible for No Cap immediately.
- Daily Profit is not paid immediately.
- Team Profit is not paid immediately.
- The first new Daily Profit and Team Profit are posted from the next Afghanistan financial day at 00:00.
- No Cap withdrawal availability begins with that next financial day.
- Missed profits during the stopped period are never back-paid.

## 14. Moving From No Cap Back to Limited
If Direct Team Capital later falls below `Original Investment × 3`:
- The user becomes `LIMITED_100`.
- A new limited withdrawal cycle starts at zero.
- Existing No-Cap withdrawals are not counted against the new 100% cycle.
- Daily Profit/Team Profit remain active until the new 100% cap is actually consumed, unless another independent stop condition applies.

## 15. Withdrawals
- A minimum reserve of `20 USDT` must remain in Available Balance after a withdrawal request.
- Minimum withdrawal is 10% of original investment:
  - VIP1 = 10 USDT
  - VIP2 = 20 USDT
  - VIP3 = 30 USDT
  - VIP4 = 40 USDT
  - VIP5 = 50 USDT
- Withdrawal fee = 10% of requested/gross amount.
- Example: request 100 USDT → fee 10 → net 90 USDT.
- Withdrawal window: 08:00:00 through 16:00:00 Afghanistan time.
- At exactly 16:00 withdrawal is allowed; after 16:00 it is closed.
- Only one withdrawal request per user per Afghanistan calendar day, regardless of whether it is pending, approved, rejected, or expired.
- A pending withdrawal does not immediately reduce Available Balance.
- A second request is evaluated against available funds after reserving existing pending amounts.
- A pending withdrawal that crosses the 00:00 financial boundary expires automatically and does not reduce Available Balance.
- The user can register a new withdrawal after the new financial day begins.
- In `LIMITED_100`, an approved withdrawal cannot push current-cycle cap usage above 100% of original investment.
- A withdrawal that would reduce Available Balance below the 20 USDT reserve is rejected.
- In `NO_CAP`, the cap check is not applied.

## 16. Withdrawal Address
- User may register a valid TRC20 address.
- Once registered, the user cannot change it.
- Only Admin can change the stored withdrawal address.
- The address used on each withdrawal is stored in the withdrawal record.

## 17. Ledger / Financial History
Every financial event must be recorded as a ledger entry, including:
- Deposit
- Daily Profit
- Team Profit
- Referral Bonus
- Referral Reversal
- Withdrawal
- Other explicit financial adjustments

Ledger entries contain an ID, user, type, amount, reference, metadata and timestamp.

- Daily financial jobs are idempotent: the same user/type/financial-date cannot be credited twice.
- Cap-status changes are stored in Cap History with previous status, new status, team capital, threshold, reason and timestamp.
- Users see current cap status; Admin can see full cap history.

## 18. Account Status
- Active: normal operation under all applicable financial rules.
- Suspended/Blocked/Deactivated: account access is disabled and financial history is preserved; no new user profit is generated while inactive.
- Reactivation does not back-pay the inactive period; new Daily/Team Profit resumes from the next Afghanistan financial day at 00:00.
- Delete is permanent under this business rule: the user's account and all associated financial history are removed.

## 19. Afghanistan Financial Clock
All of the following use `Asia/Kabul`:
- Deposit 16:00 cutoff
- Daily financial date
- Daily Profit posting at 00:00
- Team Profit financial date
- Withdrawal window 08:00–16:00
- Pending-withdrawal expiration at the financial-day boundary
- Re-activation from stopped/pending status

## 20. Implementation Safety
- Financial mutations must be represented by ledger records rather than relying only on mutable balance fields.
- Daily jobs must be idempotent.
- User ID generation must be server-side and collision-checked.
- Financial amounts are rounded consistently to 6 decimal places internally.
- Admin actions affecting financial state are written to the audit log.
