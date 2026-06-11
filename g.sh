#!/usr/bin/env bash
set -e

# Setup the repository
git init
# Force the default branch to be 'master' to avoid 'master' conflicts
git checkout -b master || true

echo "🚀 Building ResQ Git History from existing files..."

# Helper function for commits
# Usage: commit "YYYY-MM-DDTHH:MM:SS+0530" "type(scope): message" "file1" "file2" ...
commit() {
    local timestamp=$1
    local msg=$2
    shift 2

    local has_files=0
    # Only add files if they exist in the directory, using -f to override any .gitignore rules
    for file in "$@"; do
        if [ -e "$file" ]; then
            git add -f "$file"
            has_files=1
        fi
    done

    # Commit only if there are staged changes
    if [ $has_files -eq 1 ] && ! git diff --cached --quiet; then
        GIT_AUTHOR_DATE="$timestamp" \
        GIT_COMMITTER_DATE="$timestamp" \
        git commit -m "$msg"
    fi
}

# Helper function for merges
# Usage: merge "YYYY-MM-DDTHH:MM:SS+0530" "branch_name"
merge() {
    local timestamp=$1
    local branch=$2

    GIT_AUTHOR_DATE="$timestamp" \
    GIT_COMMITTER_DATE="$timestamp" \
    git merge --no-ff "$branch" -m "merge: pull request from $branch"
}

# --- master BRANCH: Init ---
# Commit 1
commit "2026-06-11T22:00:00+0530" "chore: project scaffold with Makefile and Compose" \
    "Makefile" "docker-compose.yaml" "README.md" ".github/workflows/ci.yml" "g.sh"

# --- BRANCH: chore/tooling ---
git checkout -b chore/tooling

# Commit 2
commit "2026-06-11T22:20:00+0530" "docs: add system architecture and API documentation" \
    "docs/architecture.md" "docs/tech.md" "docs/api-v1.md" "docs/openapi.yaml"

# Commit 3
commit "2026-06-11T22:45:00+0530" "docs: add database schemas and UI specifications" \
    "docs/db.md" "docs/db.mermaid" "docs/redis.md" "docs/ui-v1.md"

# Commit 4
commit "2026-06-11T23:15:00+0530" "chore(scripts): initialize utility scripts workspace" \
    "scripts/package.json" "scripts/tsconfig.json" "scripts/bun.lock"

# Commit 5
commit "2026-06-11T23:45:00+0530" "feat(scripts): add database seeder and test utilities" \
    "scripts/utils.ts" "scripts/seed.ts" "scripts/prune.ts" "scripts/test-sse.ts"

git checkout master
merge "2026-06-12T00:00:00+0530" chore/tooling

# --- BRANCH: feature/backend-core ---
git checkout -b feature/backend-core

# Commit 6
commit "2026-06-12T10:00:00+0530" "chore(backend): initialize go module and compiler configs" \
    "backend/go.mod" "backend/go.sum" "backend/README.md" "backend/sqlc.yaml" "backend/Dockerfile" "backend/.dockerignore" "backend/entrypoint.sh"

# Commit 7
commit "2026-06-12T10:30:00+0530" "feat(backend): implement env-based config loader" \
    "backend/internal/shared/config/config.go" "backend/.env.example" "backend/.env"

# Commit 8
commit "2026-06-12T11:00:00+0530" "feat(backend): setup pgx connection pooling and base migrations" \
    "backend/internal/shared/db/db.go" "backend/sql/migrations/001_init.sql" "backend/sql/migrations/002_add_user_profile_fields.sql" "backend/sql/queries/users.sql"

# Commit 9
commit "2026-06-12T11:30:00+0530" "feat(backend): implement structured zap logger and middleware" \
    "backend/internal/shared/logger/logger.go" "backend/internal/shared/middleware/logger.go" "backend/internal/shared/middleware/cors.go" "backend/internal/shared/middleware/auth.go"

# Commit 10
commit "2026-06-12T12:00:00+0530" "feat(backend): add server entrypoint and graceful shutdown" \
    "backend/cmd/resq-server/master.go"

git checkout master
merge "2026-06-12T12:15:00+0530" feature/backend-core

# --- BRANCH: feature/backend-modules ---
git checkout -b feature/backend-modules

# Commit 11
commit "2026-06-12T13:00:00+0530" "feat(identity): implement jwt auth and user profile logic" \
    "backend/internal/identity/handler.go" "backend/internal/identity/service.go"

# Commit 12
commit "2026-06-12T13:45:00+0530" "feat(geo): add polygon WKT builder and RFC7807 error handler" \
    "backend/pkg/geo/geohash.go" "backend/pkg/rfc7807/errors.go"

# Commit 13
commit "2026-06-12T14:30:00+0530" "feat(emergency): implement SOS lifecycle and spatial queries" \
    "backend/internal/emergency/handler.go" "backend/internal/emergency/service.go" "backend/sql/queries/sos.sql"

# Commit 14
commit "2026-06-12T15:15:00+0530" "feat(incidents): add disaster report moderation logic" \
    "backend/internal/incidents/handler.go" "backend/internal/incidents/service.go" "backend/sql/migrations/003_user_notifications.sql"

# Commit 15
commit "2026-06-12T16:00:00+0530" "feat(logistics): add resource camp management and weather metrics" \
    "backend/internal/logistics/handler.go" "backend/internal/logistics/service.go" "backend/internal/weather/handler.go" "backend/internal/weather/service.go"

# Commit 16
commit "2026-06-12T16:45:00+0530" "feat(realtime): implement redis streams and SSE push architecture" \
    "backend/internal/shared/redis/client.go" "backend/internal/shared/sse/hub.go" "backend/internal/notifications/handler.go" "backend/internal/notifications/service.go" "backend/sql/migrations/004_seed_admin.sql"

git checkout master
merge "2026-06-12T17:45:00+0530" feature/backend-modules

# --- BRANCH: feature/frontend-core ---
git checkout -b feature/frontend-core

# Commit 17
commit "2026-06-13T09:00:00+0530" "chore(frontend): setup bun monorepo workspace" \
    "frontend/package.json" "frontend/bun.lock" "frontend/eslint.config.js" "frontend/prettier.config.js" "frontend/README.md" "frontend/Dockerfile" "frontend/.dockerignore" "frontend/.gitignore"

# Commit 18
commit "2026-06-13T09:45:00+0530" "feat(types): define shared typescript domain models" \
    "frontend/packages/types/package.json" "frontend/packages/types/README.md" "frontend/packages/types/src/index.ts" "frontend/packages/types/src/api.ts" "frontend/packages/types/src/models.ts"

# Commit 19
commit "2026-06-13T10:30:00+0530" "feat(api-client): setup core axios instance and SSE stream wrapper" \
    "frontend/packages/api-client/package.json" "frontend/packages/api-client/README.md" "frontend/packages/api-client/src/client.ts" "frontend/packages/api-client/src/index.ts" "frontend/packages/api-client/src/sse.ts" "frontend/packages/api-client/src/vite-env.d.ts"

# Commit 20
commit "2026-06-13T11:15:00+0530" "feat(api-client): add structured service layers for all domains" \
    "frontend/packages/api-client/src/services/auth.ts" "frontend/packages/api-client/src/services/incidents.ts" "frontend/packages/api-client/src/services/maps.ts" "frontend/packages/api-client/src/services/notifications.ts" "frontend/packages/api-client/src/services/sos.ts" "frontend/packages/api-client/src/services/weather.ts"

git checkout master
merge "2026-06-13T11:45:00+0530" feature/frontend-core

# --- BRANCH: feature/ui-kit ---
git checkout -b feature/ui-kit

# Commit 21
commit "2026-06-13T12:00:00+0530" "feat(ui-kit): initialize tailwind design system" \
    "frontend/packages/ui-kit/package.json" "frontend/packages/ui-kit/README.md" "frontend/packages/ui-kit/src/index.ts" "frontend/packages/ui-kit/src/styles.css" "frontend/packages/ui-kit/src/utils.ts"

# Commit 22
commit "2026-06-13T12:45:00+0530" "feat(ui-kit): build core atomic elements" \
    "frontend/packages/ui-kit/src/components/Button.tsx" "frontend/packages/ui-kit/src/components/Card.tsx" "frontend/packages/ui-kit/src/components/Badge.tsx" "frontend/packages/ui-kit/src/components/Input.tsx"

# Commit 23
commit "2026-06-13T13:30:00+0530" "feat(ui-kit): implement complex interactive and feedback components" \
    "frontend/packages/ui-kit/src/components/AppState.tsx" "frontend/packages/ui-kit/src/components/Drawer.tsx" "frontend/packages/ui-kit/src/components/Footer.tsx" "frontend/packages/ui-kit/src/components/Modal.tsx" "frontend/packages/ui-kit/src/components/NotFound.tsx" "frontend/packages/ui-kit/src/components/OfflineBanner.tsx" "frontend/packages/ui-kit/src/components/Skeleton.tsx" "frontend/packages/ui-kit/src/components/ThemeToggle.tsx"

git checkout master
merge "2026-06-13T13:45:00+0530" feature/ui-kit

# --- BRANCH: feature/citizen-pwa ---
git checkout -b feature/citizen-pwa

# Commit 24
commit "2026-06-13T14:30:00+0530" "chore(citizen): scaffold mobile-first PWA workspace" \
    "frontend/apps/citizen-pwa/package.json" "frontend/apps/citizen-pwa/tsconfig.json" "frontend/apps/citizen-pwa/vite.config.ts" "frontend/apps/citizen-pwa/index.html" "frontend/apps/citizen-pwa/README.md" "frontend/apps/citizen-pwa/public/service-worker.js" "frontend/apps/citizen-pwa/.env" "frontend/apps/citizen-pwa/.env.example"

# Commit 25
commit "2026-06-13T15:00:00+0530" "feat(citizen): initialize store, routing, and offline sync mechanics" \
    "frontend/apps/citizen-pwa/src/master.tsx" "frontend/apps/citizen-pwa/src/router.tsx" "frontend/apps/citizen-pwa/src/routes/__root.tsx" "frontend/apps/citizen-pwa/src/store/useAppStore.ts"

# Commit 26
commit "2026-06-13T15:30:00+0530" "feat(citizen): add custom hooks for location, maps, and SSE" \
    "frontend/apps/citizen-pwa/src/hooks/useAuth.ts" "frontend/apps/citizen-pwa/src/hooks/useLocation.ts" "frontend/apps/citizen-pwa/src/hooks/useMap.ts" "frontend/apps/citizen-pwa/src/hooks/useNotifications.ts" "frontend/apps/citizen-pwa/src/hooks/useSSE.ts" "frontend/apps/citizen-pwa/src/hooks/useSync.ts" "frontend/apps/citizen-pwa/src/hooks/useWeather.ts"

# Commit 27
commit "2026-06-13T16:00:00+0530" "feat(citizen): build core application layout components" \
    "frontend/apps/citizen-pwa/src/components/AppLink.tsx" "frontend/apps/citizen-pwa/src/components/BottomNav.tsx" "frontend/apps/citizen-pwa/src/components/Header.tsx" "frontend/apps/citizen-pwa/src/components/LocationPickerModal.tsx" "frontend/apps/citizen-pwa/src/components/MapView.tsx" "frontend/apps/citizen-pwa/src/components/SosButton.tsx" "frontend/apps/citizen-pwa/src/components/UserDrawer.tsx" "frontend/apps/citizen-pwa/src/content/emergency.ts"

# Commit 28
commit "2026-06-13T16:30:00+0530" "feat(citizen): assemble dynamic home dashboard widgets" \
    "frontend/apps/citizen-pwa/src/modules/home/index.ts" "frontend/apps/citizen-pwa/src/modules/home/components/DisasterCategories.tsx" "frontend/apps/citizen-pwa/src/modules/home/components/EssentialServices.tsx" "frontend/apps/citizen-pwa/src/modules/home/components/GovTicker.tsx" "frontend/apps/citizen-pwa/src/modules/home/components/LiveStatusBanner.tsx" "frontend/apps/citizen-pwa/src/modules/home/components/MapPreviewCTA.tsx" "frontend/apps/citizen-pwa/src/modules/home/components/NoticeBoard.tsx"

# Commit 29
commit "2026-06-13T17:00:00+0530" "feat(citizen): implement user onboarding and profile routes" \
    "frontend/apps/citizen-pwa/src/routes/index.tsx" "frontend/apps/citizen-pwa/src/routes/auth.login.tsx" "frontend/apps/citizen-pwa/src/routes/auth.register.tsx" "frontend/apps/citizen-pwa/src/routes/profile.tsx"

# Commit 30
commit "2026-06-13T17:30:00+0530" "feat(citizen): build mapping, routing, and reporting features" \
    "frontend/apps/citizen-pwa/src/routes/map.tsx" "frontend/apps/citizen-pwa/src/routes/report.tsx" "frontend/apps/citizen-pwa/src/routes/camps.tsx" "frontend/apps/citizen-pwa/src/routes/camps.$id.tsx"

# Commit 31
commit "2026-06-13T18:00:00+0530" "feat(citizen): add informational routes and sos tracking" \
    "frontend/apps/citizen-pwa/src/routes/notifications.tsx" "frontend/apps/citizen-pwa/src/routes/helplines.tsx" "frontend/apps/citizen-pwa/src/routes/survival-guides.tsx" "frontend/apps/citizen-pwa/src/routes/weather.tsx" "frontend/apps/citizen-pwa/src/routes/sos-history.tsx"

git checkout master
merge "2026-06-13T18:30:00+0530" feature/citizen-pwa

# --- BRANCH: feature/admin-portal ---
git checkout -b feature/admin-portal

# Commit 32
commit "2026-06-13T19:00:00+0530" "chore(admin): scaffold admin portal vite application" \
    "frontend/apps/admin-portal/package.json" "frontend/apps/admin-portal/tsconfig.json" "frontend/apps/admin-portal/vite.config.ts" "frontend/apps/admin-portal/index.html" "frontend/apps/admin-portal/README.md" "frontend/apps/admin-portal/.env" "frontend/apps/admin-portal/.env.example"

# Commit 33
commit "2026-06-13T19:45:00+0530" "feat(admin): setup tanstack router and root layout" \
    "frontend/apps/admin-portal/src/master.tsx" "frontend/apps/admin-portal/src/router.tsx" "frontend/apps/admin-portal/src/routes/__root.tsx"

# Commit 34
commit "2026-06-13T20:30:00+0530" "feat(admin): build react-query hooks and maplibre integrations" \
    "frontend/apps/admin-portal/src/hooks/useAdminData.ts" "frontend/apps/admin-portal/src/hooks/useAdminMapLayers.ts" "frontend/apps/admin-portal/src/hooks/useMap.ts"

# Commit 35
commit "2026-06-13T21:15:00+0530" "feat(admin): implement command center and live event feed" \
    "frontend/apps/admin-portal/src/routes/auth.login.tsx" "frontend/apps/admin-portal/src/routes/index.tsx" "frontend/apps/admin-portal/src/routes/command-center.tsx"

# Commit 36
commit "2026-06-13T22:00:00+0530" "feat(admin): add polygon drawing tools for hazards and broadcasts" \
    "frontend/apps/admin-portal/src/routes/broadcast.tsx" "frontend/apps/admin-portal/src/routes/hazards.new.tsx" "frontend/apps/admin-portal/src/routes/sos.tsx"

# Commit 37
commit "2026-06-13T22:45:00+0530" "feat(admin): build high-density incident triage queue" \
    "frontend/apps/admin-portal/src/routes/triage.tsx" "frontend/apps/admin-portal/src/routes/triage.$id.tsx"

# Commit 38
commit "2026-06-13T23:30:00+0530" "feat(admin): add logistics and resource camp management" \
    "frontend/apps/admin-portal/src/routes/logistics.tsx" "frontend/apps/admin-portal/src/routes/logistics.new.tsx" "frontend/apps/admin-portal/src/routes/logistics.$id.tsx"

git checkout master
merge "2026-06-13T23:45:00+0530" feature/admin-portal

# --- BRANCH: chore/polish ---
git checkout -b chore/polish

# Commit 39
commit "2026-06-14T00:30:00+0530" "chore: add final manifest, favicons, and public assets" \
    "frontend/public/favicon.ico" "frontend/public/manifest.json" "frontend/public/robots.txt"

git checkout master
merge "2026-06-14T00:50:00+0530" chore/polish

echo "✅ Git History Fully Constructed."
git log --oneline --graph --all
git status
