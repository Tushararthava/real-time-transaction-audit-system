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
                    echo 'Deploying backend with Node.js...'
                    
                    // Stop existing Node.js process if running
                    sh '''
                        # Find and kill existing Node.js process on port 3000
                        PID=$(lsof -ti:3000) || true
                        if [ ! -z "$PID" ]; then
                            echo "Stopping existing process on port 3000 (PID: $PID)"
                            kill -9 $PID || true
                            sleep 2
                        fi
                    '''
                    
                    // Start backend with nohup
                    dir("${BACKEND_DIR}") {
                        sh '''
                            # Load environment variables if .env exists
                            if [ -f .env ]; then
                                export $(cat .env | grep -v '^#' | xargs)
                            fi
                            
                            # Start Node.js server in background
                            nohup node dist/server.js > logs/app.log 2>&1 &
                            echo $! > app.pid
                            
                            echo "Backend started with PID: $(cat app.pid)"
                            sleep 3
                        '''
                    }
                    
                    // Deploy frontend
                    echo 'Deploying frontend...'
                    sh """
                        # Create directory if it doesn't exist
                        sudo mkdir -p /var/www/html/real-time-audit
                        
                        # Copy frontend build to web server
                        sudo rm -rf /var/www/html/real-time-audit/*
                        sudo cp -r ${FRONTEND_DIR}/dist/* /var/www/html/real-time-audit/
                        sudo chown -R www-data:www-data /var/www/html/real-time-audit || true
                        
                        echo "Frontend deployed successfully"
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
                    sh 'tail -n 50 backend/logs/app.log || tail -n 50 backend/logs/error.log || echo "No logs available"'
                } catch (Exception e) {
                    echo "Could not retrieve backend logs: ${e.message}"
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
