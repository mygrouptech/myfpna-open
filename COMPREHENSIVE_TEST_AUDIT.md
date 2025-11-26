# Comprehensive Test Infrastructure Audit

**Date:** November 26, 2025  
**Purpose:** Holistic analysis of test infrastructure to identify root causes and create unified repair strategy  
**Approach:** No silo patching - unified, durable solution

---

## Executive Summary

The test infrastructure has fundamental architectural issues that cannot be fixed with piecemeal patches. The root cause is a mismatch between:
1. **Production schema** (MySQL with specific column naming and data types)
2. **Test infrastructure** (attempting to use SQLite with incompatible schema)
3. **Test approach** (trying to replicate full database instead of mocking)

**Recommendation:** Implement a proper test infrastructure using one of two proven approaches:
- **Option A:** Use actual MySQL test database (via Docker or test instance)
- **Option B:** Mock database layer at the tRPC router level (faster, no external dependencies)

---

## Current State Analysis

### 1. Test Files Inventory

Found 4 test files:
```
./server/auth.logout.test.ts
./server/donations.test.ts  
./server/forecast.test.ts
./server/scenario.test.ts
```

**Total Tests:** 25 tests
- Scenario Management: 8 tests
- Forecast Management: 10 tests
- Donations: 6 tests
- Auth: 1 test

### 2. Test Infrastructure Files

**Existing:**
- `vitest.config.ts` - Test configuration
- `server/test-setup.ts` - Attempted SQLite setup (INCOMPLETE)
- `server/test-setup-global.ts` - Global test hooks (INCOMPLETE)

**Issues:**
- Incomplete SQLite schema replication
- Column name mismatches (camelCase vs snake_case)
- MySQL-specific functions not available in SQLite
- Drizzle ORM incompatibility between MySQL and SQLite schemas

### 3. Database Architecture

**Production (MySQL):**
```typescript
// Mixed naming conventions
openId: varchar("openId", { length: 64 })  // camelCase column name
organizationId: int("organization_id")      // snake_case column name
createdAt: timestamp("createdAt")           // camelCase column name
```

**Issues:**
- Mixed naming conventions in schema
- MySQL-specific types (mysqlEnum, timestamp with defaultNow())
- MySQL-specific functions (now(), onUpdateNow())
- Complex relationships and foreign keys

### 4. Root Cause Analysis

#### Issue #1: Schema Incompatibility
**Problem:** MySQL schema cannot be directly replicated in SQLite
- Different data types
- Different function names
- Different default value syntax
- Column naming inconsistencies

**Impact:** Tests fail with "no such column" and "no such function" errors

#### Issue #2: Architectural Mismatch
**Problem:** Attempting to create a full database replica for testing
- Complex and error-prone
- Requires maintaining parallel schema definitions
- Brittle - breaks when schema changes
- Slow - requires database setup/teardown

**Impact:** High maintenance burden, unreliable tests

#### Issue #3: Test Isolation
**Problem:** Tests depend on real database operations
- Cannot run without database
- Tests are slow
- Tests can interfere with each other
- Difficult to test edge cases

**Impact:** Poor test coverage, slow test execution

---

## Unified Repair Strategy

### Option A: MySQL Test Database (Recommended for Integration Tests)

**Approach:**
1. Use Docker MySQL container for tests
2. Run migrations to create schema
3. Seed test data before each test
4. Clean up after tests

**Pros:**
- Tests real database behavior
- No schema duplication
- Catches database-specific issues
- True integration tests

**Cons:**
- Requires Docker
- Slower than mocked tests
- More complex setup

**Implementation:**
```typescript
// docker-compose.test.yml
services:
  mysql-test:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: test
      MYSQL_DATABASE: myfpna_test
    ports:
      - "3307:3306"
```

### Option B: Mock Database Layer (Recommended for Unit Tests)

**Approach:**
1. Mock database functions at the module level
2. Test business logic without database
3. Use in-memory data structures
4. Fast, isolated tests

**Pros:**
- Fast execution
- No external dependencies
- Easy to test edge cases
- True unit tests

**Cons:**
- Doesn't test database integration
- Requires mocking setup
- May miss database-specific issues

**Implementation:**
```typescript
// Mock database functions
vi.mock('./db', () => ({
  getDb: vi.fn(),
  createScenario: vi.fn(),
  getScenarios: vi.fn(),
  // ... other functions
}));
```

### Hybrid Approach (Best Practice)

**Recommendation:** Use both approaches
1. **Unit Tests** (fast, mocked) - Test business logic
2. **Integration Tests** (slower, real DB) - Test database operations
3. **E2E Tests** (slowest, full stack) - Test complete workflows

---

## Detailed Issues Found

### Database Schema Issues

1. **Mixed Column Naming**
   - Some columns use camelCase: `openId`, `createdAt`
   - Some columns use snake_case: `organization_id`, `is_active`
   - **Impact:** Inconsistent, confusing, hard to replicate in SQLite

2. **MySQL-Specific Types**
   - `mysqlEnum` - Not available in SQLite
   - `timestamp` with `defaultNow()` - Different in SQLite
   - `onUpdateNow()` - Not available in SQLite
   - **Impact:** Cannot directly port schema to SQLite

3. **Missing Columns in Test Setup**
   - Organizations: `stripe_customer_id`, `subscription_status`, etc.
   - Users: Mixed naming causing column not found errors
   - **Impact:** Tests fail immediately on insert

### Test Infrastructure Issues

1. **Incomplete Test Setup**
   - `test-setup.ts` has partial SQLite schema
   - Column names don't match Drizzle schema
   - Missing proper cleanup
   - **Impact:** Tests cannot run

2. **No Test Data Management**
   - No fixtures or factories
   - Manual test data creation in each test
   - No easy way to create test scenarios
   - **Impact:** Tests are verbose and hard to maintain

3. **No Test Utilities**
   - No helper functions for common operations
   - No test context builders
   - No assertion helpers
   - **Impact:** Duplicated code, hard to write tests

### Test Coverage Issues

1. **Missing Test Categories**
   - No unit tests for utility functions
   - No integration tests for API endpoints
   - No E2E tests for user workflows
   - **Impact:** Low confidence in code quality

2. **Incomplete Test Cases**
   - Only happy path tested
   - Missing error cases
   - Missing edge cases
   - Missing validation tests
   - **Impact:** Bugs not caught by tests

---

## Unified Solution Design

### Phase 1: Clean Up Current Mess

1. **Remove Incomplete SQLite Setup**
   - Delete `server/test-setup.ts`
   - Delete `server/test-setup-global.ts`
   - Remove better-sqlite3 dependency
   - Clean vitest config

2. **Quarantine Broken Tests**
   - Move current tests to `server/__tests__/quarantine/`
   - Document what each test was trying to do
   - Use as reference for rewriting

### Phase 2: Implement Proper Test Infrastructure

#### For Unit Tests (Fast, Mocked)

1. **Create Mock Database Layer**
   ```typescript
   // server/__tests__/mocks/db.mock.ts
   export const mockDb = {
     scenarios: new Map(),
     budgets: new Map(),
     actuals: new Map(),
     // ... in-memory stores
   };
   ```

2. **Create Test Utilities**
   ```typescript
   // server/__tests__/utils/test-helpers.ts
   export function createTestContext(role: Role): TrpcContext
   export function createTestScenario(overrides?: Partial<Scenario>): Scenario
   export function createTestUser(overrides?: Partial<User>): User
   ```

3. **Create Test Fixtures**
   ```typescript
   // server/__tests__/fixtures/scenarios.ts
   export const testScenarios = {
     draft: { ... },
     approved: { ... },
     // ... predefined test data
   };
   ```

#### For Integration Tests (Real Database)

1. **Setup Test Database**
   ```typescript
   // server/__tests__/setup/test-db.ts
   export async function setupTestDatabase() {
     // Connect to test MySQL instance
     // Run migrations
     // Seed initial data
   }
   ```

2. **Create Database Helpers**
   ```typescript
   // server/__tests__/utils/db-helpers.ts
   export async function cleanDatabase()
   export async function seedTestData()
   export async function createTestOrganization()
   ```

### Phase 3: Rewrite Tests Properly

1. **Unit Tests** - Test business logic
   ```typescript
   describe('Scenario Business Logic', () => {
     it('should validate scenario dates', () => {
       // Pure function tests
     });
   });
   ```

2. **Integration Tests** - Test database operations
   ```typescript
   describe('Scenario Database Operations', () => {
     beforeEach(async () => {
       await cleanDatabase();
       await seedTestData();
     });
     
     it('should create scenario in database', async () => {
       // Test with real database
     });
   });
   ```

3. **API Tests** - Test tRPC routers
   ```typescript
   describe('Scenario API', () => {
     it('should create scenario via API', async () => {
       const caller = appRouter.createCaller(testContext);
       const result = await caller.scenario.create({ ... });
       expect(result).toHaveProperty('id');
     });
   });
   ```

---

## Implementation Plan

### Step 1: Clean Up (15 minutes)
- Remove broken SQLite setup files
- Remove better-sqlite3 dependency
- Quarantine existing tests
- Update vitest config

### Step 2: Create Test Infrastructure (45 minutes)
- Create mock database layer
- Create test utilities and helpers
- Create test fixtures
- Create test context builders

### Step 3: Rewrite Tests (60 minutes)
- Rewrite scenario tests with mocks
- Rewrite forecast tests with mocks
- Rewrite donations tests with mocks
- Rewrite auth tests with mocks

### Step 4: Verify and Document (30 minutes)
- Run all tests - verify 100% pass
- Document test patterns
- Create testing guide
- Update README

**Total Time:** ~2.5 hours

---

## Expected Outcomes

### After Unified Repair

1. **All 25 Tests Passing** ✅
   - 0 failures
   - Fast execution (< 5 seconds)
   - Reliable and deterministic

2. **Maintainable Test Infrastructure** ✅
   - Clear patterns
   - Easy to add new tests
   - Well-documented
   - No external dependencies for unit tests

3. **High Code Quality** ✅
   - Business logic tested
   - Edge cases covered
   - Error handling verified
   - Confidence in changes

4. **Future-Proof** ✅
   - Can add integration tests later
   - Can add E2E tests later
   - Scalable architecture
   - Easy to extend

---

## Comparison: Silo Patching vs Unified Solution

### Silo Patching Approach (What We Were Doing)
- ❌ Fix one column name → another breaks
- ❌ Add one table → missing another
- ❌ Fix one function → another incompatible
- ❌ Endless cycle of patches
- ❌ Never actually works
- ❌ High maintenance burden

### Unified Solution (What We Should Do)
- ✅ Design proper architecture first
- ✅ Implement complete solution
- ✅ Test thoroughly
- ✅ Document clearly
- ✅ Works reliably
- ✅ Low maintenance burden

---

## Recommendation

**Proceed with Unified Solution:**

1. **Immediate:** Implement mock-based unit tests (Phase 1-3)
   - Fast to implement
   - No external dependencies
   - Gets tests passing immediately
   - Good enough for publishing

2. **Future:** Add integration tests with real MySQL
   - After initial publish
   - When more time available
   - For comprehensive testing
   - Before major releases

**This approach:**
- ✅ Gets tests passing quickly
- ✅ Enables publishing immediately
- ✅ Provides good test coverage
- ✅ Sets up for future expansion
- ✅ Avoids silo patching trap

---

## Next Steps

**Ready to proceed?**

I will:
1. Clean up broken SQLite setup
2. Implement proper mock-based test infrastructure
3. Rewrite all 25 tests to use mocks
4. Verify 100% pass rate
5. Push to GitHub
6. Create checkpoint for publishing

**Estimated time:** 2-3 hours for complete, durable solution

---

**Audit Completed:** November 26, 2025  
**Status:** Ready for unified repair implementation  
**Confidence:** HIGH - Clear path forward
