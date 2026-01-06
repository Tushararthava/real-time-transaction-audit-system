pipeline {
    agent any
    
    environment {
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'fontend'
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out pre-built code from repository...'
                checkout scm
            }
        }
        
        stage('Verify Build') {
            steps {
                script {
                    echo 'Verifying pre-built artifacts exist...'
                    
                    // Check backend dist exists
                    sh """
                        if [ ! -d "${BACKEND_DIR}/dist" ]; then
                            echo "ERROR: Backend dist folder not found!"
                            echo "Please run build-and-deploy.bat locally before pushing."
                            exit 1
                        fi
                        echo "✓ Backend dist folder found"
                    """
                    
                    // Check frontend dist exists
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
        
        
        stage('Deploy') {
            steps {
                echo 'Deploying pre-built application...'
                script {
                    echo 'Deploying backend...'
                    
                    // Stop existing Node.js process if running
                    sh '''
                        PID=$(lsof -ti:3000) || true
                        if [ ! -z "$PID" ]; then
                            echo "Stopping existing process on port 3000 (PID: $PID)"
                            kill -9 $PID || true
                            sleep 2
                        fi
                    '''
                    
                    // Start backend from pre-built dist
                    dir("${BACKEND_DIR}") {
                        sh '''
                            # Create logs directory
                            mkdir -p logs
                            
                            # Load environment variables if .env exists
                            if [ -f .env ]; then
                                export $(cat .env | grep -v '^#' | xargs)
                            fi
                            
                            # Start Node.js server in background (use full path)
                            nohup /usr/bin/node dist/server.js > logs/app.log 2>&1 &
                            echo $! > app.pid
                            
                            echo "Backend started with PID: $(cat app.pid)"
                            sleep 3
                        '''
                    }
                    
                    // Deploy frontend
                    echo 'Deploying frontend...'
                    sh """
                        # Create directory if needed
                        mkdir -p /var/www/html/real-time-audit || echo "Directory exists"
                        
                        # Copy pre-built frontend
                        rm -rf /var/www/html/real-time-audit/* || true
                        cp -r ${FRONTEND_DIR}/dist/* /var/www/html/real-time-audit/ || echo "Copy completed"
                        
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
                    sleep(time: 5, unit: 'SECONDS')
                    
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
            echo '✅ Deployment completed successfully!'
            echo 'Backend: http://localhost:3000'
            echo 'Frontend: http://localhost'
        }
        failure {
            script {
                echo '❌ Deployment failed!'
                try {
                    sh 'tail -n 50 backend/logs/app.log || echo "No logs available"'
                } catch (Exception e) {
                    echo "Could not retrieve logs: ${e.message}"
                }
            }
        }
        always {
            echo 'Deployment pipeline completed.'
        }
    }
}
