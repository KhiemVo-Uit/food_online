import { Container, Row, Col, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'

const Home = () => {
  return (
    <>
      {/* Hero Section */}
      <div className="bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                Đồ ăn ngon, giao nhanh chóng
              </h1>
              <p className="lead mb-4">
                Đặt món từ hàng ngàn nhà hàng yêu thích của bạn
              </p>
              <Button as={Link} to="/restaurants" variant="light" size="lg">
                <i className="bi bi-search me-2"></i>
                Tìm nhà hàng
              </Button>
            </Col>
            <Col lg={6} className="text-center">
              <div className="fs-1">🍕🍔🍱🍜🍰</div>
            </Col>
          </Row>
        </Container>
      </div>

      {/* Features */}
      <Container className="py-5">
        <h2 className="text-center mb-5">Tại sao chọn chúng tôi?</h2>
        <Row className="g-4">
          <Col md={4}>
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <i className="bi bi-lightning-charge-fill fs-1 text-primary"></i>
              </div>
              <h4>Giao hàng nhanh</h4>
              <p className="text-muted">Giao đồ ăn trong 30 phút</p>
            </div>
          </Col>
          
          <Col md={4}>
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <i className="bi bi-shop fs-1 text-primary"></i>
              </div>
              <h4>Nhiều lựa chọn</h4>
              <p className="text-muted">Hàng ngàn nhà hàng đa dạng</p>
            </div>
          </Col>
          
          <Col md={4}>
            <div className="text-center">
              <div className="bg-primary bg-opacity-10 rounded-circle d-inline-flex p-4 mb-3">
                <i className="bi bi-shield-check fs-1 text-primary"></i>
              </div>
              <h4>An toàn & tin cậy</h4>
              <p className="text-muted">Thanh toán bảo mật 100%</p>
            </div>
          </Col>
        </Row>
      </Container>

      {/* CTA Section */}
      <div className="bg-light py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={8}>
              <h3>Bạn là chủ nhà hàng?</h3>
              <p className="text-muted mb-0">
                Tham gia cùng chúng tôi để mở rộng kinh doanh của bạn
              </p>
            </Col>
            <Col lg={4} className="text-lg-end">
              <Button variant="primary" size="lg">
                Đăng ký ngay
              </Button>
            </Col>
          </Row>
        </Container>
      </div>
    </>
  )
}

export default Home
