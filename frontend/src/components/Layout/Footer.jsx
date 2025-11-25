import { Container, Row, Col } from 'react-bootstrap'

const Footer = () => {
  return (
    <footer className="bg-dark text-light py-4 mt-5">
      <Container>
        <Row>
          <Col md={4}>
            <h5 className="text-primary">
              <i className="bi bi-shop me-2"></i>
              Food Online
            </h5>
            <p className="text-muted">
              Nền tảng giao đồ ăn hàng đầu Việt Nam
            </p>
          </Col>
          
          <Col md={4}>
            <h6>Liên kết nhanh</h6>
            <ul className="list-unstyled">
              <li><a href="/restaurants" className="text-muted text-decoration-none">Nhà hàng</a></li>
              <li><a href="/about" className="text-muted text-decoration-none">Về chúng tôi</a></li>
              <li><a href="/contact" className="text-muted text-decoration-none">Liên hệ</a></li>
            </ul>
          </Col>
          
          <Col md={4}>
            <h6>Theo dõi chúng tôi</h6>
            <div className="d-flex gap-3">
              <a href="#" className="text-muted fs-4"><i className="bi bi-facebook"></i></a>
              <a href="#" className="text-muted fs-4"><i className="bi bi-instagram"></i></a>
              <a href="#" className="text-muted fs-4"><i className="bi bi-twitter"></i></a>
            </div>
          </Col>
        </Row>
        
        <hr className="my-4 bg-secondary" />
        
        <Row>
          <Col className="text-center text-muted">
            <p className="mb-0">© {new Date().getFullYear()} Food Online. All rights reserved.</p>
          </Col>
        </Row>
      </Container>
    </footer>
  )
}

export default Footer
