---
description: How to create a bug report when a test fails
---

# Bug Report Workflow

When a test fails, follow these steps to create a proper bug report.

## 1. Identify the Failing Test

Run the failing test to get details:
```bash
cd "d:\GitHub\Al-Noran-System-Development\Mobile Application"
flutter test test/unit/<test_file>.dart
```

## 2. Analyze the Failure

Note down:
- **Test name**: The test function that failed
- **Expected value**: What the test expected
- **Actual value**: What the code returned
- **File/Line**: Where the bug exists

## 3. Create Bug Report

Create a new file in `docs/bugs/` using this naming convention:
```
BUG-XXX-<short-description>.md
```

## 4. Fill the Template

Use the bug report template at `docs/bugs/TEMPLATE.md`:
- Copy the template
- Fill in all sections
- Include test case that reproduces the bug

## 5. Fix the Bug

1. Fix the code in the source file
2. Run the test again to verify
3. Update bug report status to ✅ FIXED

## 6. Commit

```bash
git add .
git commit -m "fix: BUG-XXX - <short description>"
```

---

## Quick Commands

// turbo
### Run all unit tests
```bash
flutter test test/unit/ --reporter compact
```

// turbo
### Run specific test file
```bash
flutter test test/unit/validators_test.dart
```

// turbo
### Run with verbose output
```bash
flutter test test/unit/ --reporter expanded
```
