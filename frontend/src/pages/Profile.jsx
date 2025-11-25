import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const profileSchema = Yup.object().shape({
  name: Yup.string().required('Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  phone: Yup.string(),
  address: Yup.string(),
});

function Profile() {
  const { user } = useAuth();

  const handleSubmit = async (values) => {
    try {
      // TODO: Implement update profile API
      console.log('Update profile:', values);
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error('Failed to update profile');
      console.error(err);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <Card>
            <Card.Header>
              <h3 className="mb-0">My Profile</h3>
            </Card.Header>
            <Card.Body>
              <Formik
                initialValues={{
                  name: user?.name || '',
                  email: user?.email || '',
                  phone: user?.phone || '',
                  address: user?.address || '',
                }}
                validationSchema={profileSchema}
                onSubmit={handleSubmit}
              >
                {({ values, errors, touched, handleChange, handleSubmit }) => (
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
                        disabled
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.email}
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
                        rows={3}
                        name="address"
                        value={values.address}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <div className="mb-3">
                      <strong>Role:</strong>{' '}
                      <span className="text-capitalize">{user?.role?.toLowerCase()}</span>
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-100">
                      Update Profile
                    </Button>
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

export default Profile;
