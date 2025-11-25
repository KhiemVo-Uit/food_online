import { Link } from 'react-router-dom'
import { Navbar as BSNavbar, Container, Nav, Badge, Button } from 'react-bootstrap'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import NotificationBell from '../NotificationBell'

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth()
  const { getCartCount } = useCart()

  return (
    <BSNavbar bg="white" expand="lg" className="shadow-sm">
      <Container>
        <BSNavbar.Brand as={Link} to="/" className="fw-bold text-primary">
          <i className="bi bi-shop me-2"></i>
          Food Online
        </BSNavbar.Brand>
        
        <BSNavbar.Toggle aria-controls="basic-navbar-nav" />
        
        <BSNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto align-items-center">
            <Nav.Link as={Link} to="/">
              <i className="bi bi-house-door me-1"></i>
              Trang chủ
            </Nav.Link>
            
            <Nav.Link as={Link} to="/restaurants">
              <i className="bi bi-shop me-1"></i>
              Nhà hàng
            </Nav.Link>

            {isAuthenticated && (
              <Nav.Link as={Link} to="/orders">
                <i className="bi bi-receipt me-1"></i>
                Đơn hàng
              </Nav.Link>
            )}

            <Nav.Link as={Link} to="/cart" className="position-relative">
              <i className="bi bi-cart3 me-1"></i>
              Giỏ hàng
              {getCartCount() > 0 && (
                <Badge 
                  bg="danger" 
                  pill 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.7rem' }}
                >
                  {getCartCount()}
                </Badge>
              )}
            </Nav.Link>

            {isAuthenticated ? (
              <>
                <NotificationBell />
                <Nav.Link as={Link} to="/profile">
                  <i className="bi bi-person-circle me-1"></i>
                  {user?.name}
                </Nav.Link>
                <Nav.Link onClick={logout}>
                  <i className="bi bi-box-arrow-right me-1"></i>
                  Đăng xuất
                </Nav.Link>
              </>
            ) : (
              <>
                <Nav.Link as={Link} to="/login">
                  <i className="bi bi-box-arrow-in-right me-1"></i>
                  Đăng nhập
                </Nav.Link>
                <Nav.Link as={Link} to="/register">
                  <Button variant="primary" size="sm">
                    Đăng ký
                  </Button>
                </Nav.Link>
              </>
            )}
          </Nav>
        </BSNavbar.Collapse>
      </Container>
    </BSNavbar>
  )
}

export default Navbar
