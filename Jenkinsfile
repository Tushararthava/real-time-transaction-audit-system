pipeline {
    agent any
    
    environment {
        // Project directories
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'fontend'
        
        // Docker registry (update if using private registry)
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_BACKEND = 'real-time-audit-backend'
        DOCKER_IMAGE_FRONTEND = 'real-time-audit-frontend'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from repository...'
                checkout scm
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            echo 'Installing backend dependencies...'
                            sh 'npm ci'
                        }
                    }
                }
                stage('Frontend Dependencies') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            echo 'Installing frontend dependencies...'
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Generate Prisma Client') {
            steps {
                dir("${BACKEND_DIR}") {
                    echo 'Generating Prisma client...'
                    sh 'npm run prisma:generate'
                }
            }
        }
        
        stage('Build') {
            parallel {
                stage('Build Backend') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            echo 'Building backend...'
                            sh 'npm run build'
                        }
                    }
                }
                stage('Build Frontend') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            echo 'Building frontend...'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }
        
        stage('Run Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            echo 'Running backend tests...'
                            // Add test command when available
                            // sh 'npm test'
                            echo 'No tests configured yet'
                        }
                    }
                }
                stage('Frontend Tests') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            echo 'Running frontend tests...'
                            // Add test command when available
                            // sh 'npm test'
                            echo 'No tests configured yet'
                        }
                    }
                }
            }
        }
        
        stage('Deploy') {
            steps {
                echo 'Deploying application...'
                script {
                    // Option 1: Deploy to PM2 (if running on same server)
                    echo 'Deploying with PM2...'
                    
                    // Stop existing processes
                    sh '''
                        pm2 stop real-time-audit-backend || true
                        pm2 delete real-time-audit-backend || true
                    '''
                    
                    // Start backend with PM2
                    dir("${BACKEND_DIR}") {
                        sh '''
                            pm2 start dist/server.js --name real-time-audit-backend \
                                --env production \
                                --max-memory-restart 500M \
                                --log-date-format "YYYY-MM-DD HH:mm:ss Z"
                        '''
                    }
                    
                    // Save PM2 configuration
                    sh 'pm2 save'
                    
                    // Option 2: Copy frontend build to web server
                    echo 'Deploying frontend...'
                    sh """
                        # Copy frontend build to nginx/apache web root
                        # Update this path based on your web server configuration
                        sudo rm -rf /var/www/html/real-time-audit/*
                        sudo cp -r ${FRONTEND_DIR}/dist/* /var/www/html/real-time-audit/
                        sudo chown -R www-data:www-data /var/www/html/real-time-audit
                    """
                }
            }
        }
        
        stage('Health Check') {
            steps {
                echo 'Performing health checks...'
                script {
                    // Wait for backend to start
                    sleep(time: 10, unit: 'SECONDS')
                    
                    // Check backend health
                    sh '''
                        curl -f http://localhost:3000/health || exit 1
                    '''
                    
                    echo 'Health checks passed!'
                }
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline completed successfully!'
            // Send notification (email, Slack, etc.)
        }
        failure {
            script {
                echo 'Pipeline failed!'
                // Send failure notification
                try {
                    sh 'pm2 logs real-time-audit-backend --lines 50 --nostream || true'
                } catch (Exception e) {
                    echo "Could not retrieve PM2 logs: ${e.message}"
                }
            }
        }
        always {
            echo 'Cleaning up...'
            // Clean workspace if needed
            // cleanWs()
        }
    }
}
