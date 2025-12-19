# Bug Report: Phone Validator - Incorrect +20 Country Code Pattern

## Bug ID: BUG-001
## Severity: **High** 
## Component: `lib/util/validators.dart`
## Status: ✅ FIXED

---

## Summary
The Egyptian phone number validator incorrectly rejects valid phone numbers with the `+20` country code format.

---

## Expected Behavior
The following phone numbers should be **VALID**:
| Phone Number | Format | Should Be |
|--------------|--------|-----------|
| `+201012345678` | +20 + Vodafone (010) | ✅ Valid |
| `+201112345678` | +20 + Etisalat (011) | ✅ Valid |
| `+201212345678` | +20 + Orange (012) | ✅ Valid |
| `+201512345678` | +20 + WE (015) | ✅ Valid |

## Actual Behavior
All the above numbers are **rejected** as invalid.

The validator only accepts:
| Phone Number | Format | Current Result |
|--------------|--------|----------------|
| `+2001012345678` | Wrong 14-char format | ✅ Accepted (incorrectly) |

---

## Root Cause

In `lib/util/validators.dart` line 43-44:

```dart
// Current WRONG pattern:
final pattern2 = RegExp(r'^\+2001[0125][0-9]{8}$');
// Expects: +2001 + [0125] + 8 digits = 14 characters

// Should be:
final pattern2 = RegExp(r'^\+201[0125][0-9]{8}$');
// Expects: +20 + 1[0125] + 8 digits = 13 characters
```

---

## How to Reproduce

1. Call `AlNoranValidators.isValidEgyptianPhone('+201012345678')`
2. **Expected**: Returns `true`
3. **Actual**: Returns `false`

---

## Test Case

```dart
test('should return true for numbers with country code +20', () {
  expect(
    AlNoranValidators.isValidEgyptianPhone('+201012345678'),
    isTrue,
    reason: 'should accept valid Vodafone number with +20',
  );
  expect(
    AlNoranValidators.isValidEgyptianPhone('+201112345678'),
    isTrue,
    reason: 'should accept valid Etisalat number with +20',
  );
});
```

---

## Proposed Fix

Change line 44 in `validators.dart`:

```diff
- final pattern2 = RegExp(r'^\+2001[0125][0-9]{8}$');
+ final pattern2 = RegExp(r'^\+201[0125][0-9]{8}$');
```

---

## Impact
- Users entering phone numbers with `+20` prefix will fail validation
- Registration/profile updates may reject valid phone numbers
- Common Egyptian phone format is broken

---

## Date Found: 2025-12-18
## Found By: Automated Testing of Aly Ibrahim
