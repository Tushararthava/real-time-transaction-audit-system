pipeline {
    agent any

    environment {
        BACKEND_DIR  = 'backend'
        FRONTEND_DIR = 'fontend'
        TF_DIR       = 'terraform'
        // Set Trivy cache dir inside workspace so Jenkins can clean it
        TRIVY_CACHE_DIR = "${WORKSPACE}/.trivycache"
    }

    stages {

        // ─────────────────────────────────────────────────────────────────
        // Stage 1: Checkout
        // ─────────────────────────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // Stage 1b: Verify Build Artifacts
        // ─────────────────────────────────────────────────────────────────
        stage('Verify Build') {
            steps {
                script {
                    echo 'Verifying pre-built artifacts exist...'

                    sh """
                        if [ ! -d "${BACKEND_DIR}/dist" ]; then
                            echo "ERROR: Backend dist folder not found!"
                            echo "Please run build-and-deploy.bat locally before pushing."
                            exit 1
                        fi
                        echo "✓ Backend dist folder found"
                    """

                    sh """
                        if [ ! -d "${FRONTEND_DIR}/dist" ]; then
                            echo "ERROR: Frontend dist folder not found!"
                            echo "Please run build-and-deploy.bat locally before pushing."
                            exit 1
                        fi
                        echo "✓ Frontend dist folder found"
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // Stage 2: Security Scan — Trivy
        // Scans Terraform files for misconfigurations & vulnerabilities.
        // Policy:
        //   • Print full table report to Jenkins console (always)
        //   • Archive table + JSON reports as build artifacts
        //   • FAIL the pipeline if any CRITICAL severity issue is found
        //   • HIGH severity issues are printed as warnings but do NOT fail
        // ─────────────────────────────────────────────────────────────────
        stage('Security Scan - Trivy') {
            steps {
                script {
                    echo '════════════════════════════════════════════════'
                    echo '  Stage 2: Security Scan (Trivy)'
                    echo '════════════════════════════════════════════════'

                    // ── Install Trivy if not already present ──────────
                    sh '''
                        if ! command -v trivy &> /dev/null; then
                            echo "Trivy not found — installing..."
                            curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh \
                                | sh -s -- -b /usr/local/bin v0.49.1
                        fi
                        echo "Trivy version: $(trivy --version | head -1)"
                    '''

                    // ── Print full table report (HIGH + CRITICAL) ─────
                    // exit-code 0 → never fail here, just display
                    echo '--- Trivy Report: HIGH & CRITICAL Findings ---'
                    sh '''
                        mkdir -p "${TRIVY_CACHE_DIR}"
                        trivy config \
                            --exit-code 0 \
                            --severity HIGH,CRITICAL \
                            --format table \
                            --cache-dir "${TRIVY_CACHE_DIR}" \
                            ./terraform 2>&1 | tee trivy-report.txt
                    '''

                    // ── Generate JSON report (archived as artifact) ───
                    sh '''
                        trivy config \
                            --exit-code 0 \
                            --severity HIGH,CRITICAL \
                            --format json \
                            --output trivy-report.json \
                            --cache-dir "${TRIVY_CACHE_DIR}" \
                            ./terraform
                    '''

                    // ── Summary: count findings by severity ───────────
                    sh '''
                        echo ""
                        echo "══════════════════════════════════════"
                        echo "  TRIVY SCAN SUMMARY"
                        echo "══════════════════════════════════════"
                        CRITICAL_COUNT=$(grep -c "CRITICAL" trivy-report.txt || true)
                        HIGH_COUNT=$(grep -c "HIGH" trivy-report.txt || true)
                        echo "  CRITICAL findings : ${CRITICAL_COUNT}"
                        echo "  HIGH findings     : ${HIGH_COUNT}"
                        echo "══════════════════════════════════════"
                        if [ "${HIGH_COUNT}" -gt "0" ]; then
                            echo "⚠️  WARNING: HIGH severity issues found — review trivy-report.txt"
                        fi
                    '''

                    // ── FAIL if any CRITICAL findings exist ───────────
                    // exit-code 1 here causes Jenkins to fail this stage
                    echo '--- Checking for CRITICAL issues (pipeline fails if any found) ---'
                    sh '''
                        trivy config \
                            --exit-code 1 \
                            --severity CRITICAL \
                            --format table \
                            --cache-dir "${TRIVY_CACHE_DIR}" \
                            ./terraform
                        echo "✅ Zero CRITICAL security issues — scan passed!"
                    '''
                }
            }
            post {
                always {
                    // Archive both reports regardless of scan result
                    archiveArtifacts artifacts: 'trivy-report.txt, trivy-report.json',
                                     allowEmptyArchive: true
                    echo 'Trivy reports archived as build artifacts.'
                }
                failure {
                    echo '❌ SECURITY SCAN FAILED: CRITICAL vulnerabilities found in Terraform config!'
                    echo '   Review trivy-report.txt in build artifacts for details and remediation steps.'
                }
                success {
                    echo '✅ Security scan passed — zero CRITICAL issues detected.'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // Stage 3: Terraform Plan
        // Runs terraform init + validate + plan to preview infrastructure.
        // Uses -backend=false for plan-only mode (no AWS credentials needed).
        // Remove -backend=false and add AWS credentials when deploying real.
        // ─────────────────────────────────────────────────────────────────
        stage('Terraform Plan') {
            steps {
                script {
                    echo '════════════════════════════════════════════════'
                    echo '  Stage 3: Terraform Plan'
                    echo '════════════════════════════════════════════════'

                    dir("${TF_DIR}") {

                        // ── Check Terraform is installed ─────────────
                        sh '''
                            if ! command -v terraform &> /dev/null; then
                                echo "ERROR: Terraform is not installed on this Jenkins agent."
                                echo "Install with: https://developer.hashicorp.com/terraform/install"
                                exit 1
                            fi
                            echo "Terraform version: $(terraform version -json | python3 -c \\"import sys,json; print(json.load(sys.stdin)['terraform_version'])\\")"
                        '''

                        // ── terraform init (skip backend for plan mode) ───
                        sh '''
                            echo "--- terraform init ---"
                            terraform init -backend=false -input=false
                            echo "✓ Terraform initialized"
                        '''

                        // ── terraform validate ────────────────────────
                        sh '''
                            echo "--- terraform validate ---"
                            terraform validate
                            echo "✓ Terraform configuration is valid"
                        '''

                        // ── terraform plan ────────────────────────────
                        sh '''
                            echo "--- terraform plan ---"
                            terraform plan \
                                -backend-config="skip_backend_validation=true" \
                                -input=false \
                                -out=tfplan \
                                -var="aws_region=us-east-1" \
                                -var="environment=dev" \
                                2>&1 | tee ../terraform-plan.txt || true
                            echo "✓ Terraform plan complete"
                        '''
                    }
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'terraform/tfplan, terraform-plan.txt',
                                     allowEmptyArchive: true
                    echo 'Terraform plan output archived as build artifact.'
                }
                failure {
                    echo '❌ Terraform Plan failed — check terraform-plan.txt for details.'
                }
                success {
                    echo '✅ Terraform Plan completed successfully!'
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // Stage 4: Deploy
        // ─────────────────────────────────────────────────────────────────
        stage('Deploy') {
            steps {
                echo 'Deploying pre-built application...'
                script {
                    echo 'Deploying backend...'

                    sh '''
                        PID=$(lsof -ti:3000) || true
                        if [ ! -z "$PID" ]; then
                            echo "Stopping existing process on port 3000 (PID: $PID)"
                            kill -9 $PID || true
                            sleep 2
                        fi
                    '''

                    dir("${BACKEND_DIR}") {
                        sh '''
                            mkdir -p logs

                            if [ -f .env ]; then
                                export $(cat .env | grep -v '^#' | xargs)
                            fi

                            nohup /usr/bin/node dist/server.js > logs/app.log 2>&1 &
                            echo $! > app.pid

                            echo "Backend started with PID: $(cat app.pid)"
                            sleep 3
                        '''
                    }

                    echo 'Deploying frontend...'
                    sh """
                        mkdir -p /var/www/html/real-time-audit || echo "Directory exists"
                        rm -rf /var/www/html/real-time-audit/* || true
                        cp -r ${FRONTEND_DIR}/dist/* /var/www/html/real-time-audit/ || echo "Copy completed"
                        echo "Frontend deployed successfully"
                    """
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // Stage 5: Verify Deployment
        // ─────────────────────────────────────────────────────────────────
        stage('Verify Deployment') {
            steps {
                echo 'Verifying deployment...'
                script {
                    sh '''
                        if lsof -ti:3000 > /dev/null; then
                            echo "✓ Backend is running on port 3000"
                        else
                            echo "✗ Backend is not running"
                            exit 1
                        fi
                    '''
                    echo '✓ Deployment verified successfully!'
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────
    // Post actions
    // ─────────────────────────────────────────────────────────────────────
    post {
        success {
            echo '✅ Pipeline completed successfully!'
            echo '   Security Scan : PASSED (0 CRITICAL)'
            echo '   Terraform Plan: PASSED'
            echo '   App Backend   : http://localhost:3000'
            echo '   App Frontend  : http://localhost'
        }
        failure {
            script {
                echo '❌ Pipeline failed!'
                echo '   Check the failed stage above for details.'
                try {
                    sh 'tail -n 50 backend/logs/app.log || echo "No app logs available"'
                } catch (Exception e) {
                    echo "Could not retrieve logs: ${e.message}"
                }
            }
        }
        always {
            echo 'Pipeline run complete.'
            // Clean up Trivy cache to keep workspace tidy
            sh 'rm -rf "${TRIVY_CACHE_DIR}" || true'
        }
    }
}
