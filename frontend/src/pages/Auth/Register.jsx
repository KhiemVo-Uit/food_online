import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

const registerSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  password_confirmation: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Password confirmation is required'),
  phone: Yup.string(),
  address: Yup.string(),
});

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [error, setError] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      await register(values);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={5}>
          <Card>
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">Register</h2>

              {error && <Alert variant="danger">{error}</Alert>}

              <Formik
                initialValues={{
                  name: '',
                  email: '',
                  password: '',
                  password_confirmation: '',
                  phone: '',
                  address: '',
                }}
                validationSchema={registerSchema}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, handleChange, handleSubmit, isSubmitting }) => (
                  <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label>Name *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        isInvalid={touched.name && errors.name}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.name}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Email *</Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        isInvalid={touched.email && errors.email}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password"
                        value={values.password}
                        onChange={handleChange}
                        isInvalid={touched.password && errors.password}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Confirm Password *</Form.Label>
                      <Form.Control
                        type="password"
                        name="password_confirmation"
                        value={values.password_confirmation}
                        onChange={handleChange}
                        isInvalid={touched.password_confirmation && errors.password_confirmation}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.password_confirmation}
                      </Form.Control.Feedback>
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Phone</Form.Label>
                      <Form.Control
                        type="text"
                        name="phone"
                        value={values.phone}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Form.Group className="mb-3">
                      <Form.Label>Address</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={2}
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <Button
                      type="submit"
                      variant="primary"
                      className="w-100 mb-3"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Registering...' : 'Register'}
                    </Button>

                    <div className="text-center">
                      Already have an account? <Link to="/login">Login here</Link>
                    </div>
                  </Form>
                )}
              </Formik>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Register;
