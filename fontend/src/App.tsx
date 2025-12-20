import { Routes, Route, Navigate } from 'react-router-dom';
import { Providers } from './app/providers';
import { ProtectedRoute } from './app/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Transfer } from './pages/Transfer';
import { History } from './pages/History';
import './index.css';

function App() {
    return (
        <Providers>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <AppLayout>
                                <Transfer />
                            </AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/history"
                    element={
                        <ProtectedRoute>
                            <AppLayout>
                                <History />
                            </AppLayout>
                        </ProtectedRoute>
                    }
                />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Providers>
    );
}

export default App;
