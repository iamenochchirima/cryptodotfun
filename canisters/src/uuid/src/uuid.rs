use candid::{ types::{ Serializer, Type, TypeInner }, CandidType, Deserialize };
use uuid::{ Builder, Uuid as UuidImpl };

use crate::{ errors::ApiError, rand::with_random_bytes };

const UUID_SIZE: usize = 16;

#[derive(Debug, Clone, Copy, Default, Ord, PartialOrd, PartialEq, Eq)]
pub struct Uuid(UuidImpl);

impl Uuid {
    pub const MIN: Uuid = Self(UuidImpl::from_bytes([0; UUID_SIZE]));
    pub const MAX: Uuid = Self(UuidImpl::from_bytes([255; UUID_SIZE]));

    pub async fn new() -> Result<Self, ApiError> {
        with_random_bytes(|bytes: [u8; UUID_SIZE]| Self::from_random_bytes(bytes)).await
    }

    pub fn from_random_bytes(bytes: [u8; UUID_SIZE]) -> Self {
        Self(Builder::from_random_bytes(bytes).into_uuid())
    }

    pub fn max() -> Self {
        Self(UuidImpl::max())
    }

    pub fn min() -> Self {
        Self(UuidImpl::nil())
    }
}

impl TryFrom<&str> for Uuid {
    type Error = ApiError;

    fn try_from(uuid: &str) -> Result<Uuid, Self::Error> {
        let uuid = UuidImpl::parse_str(uuid).map_err(|_| {
            ApiError::internal(&format!("Failed to parse UUID from string: {}", uuid))
        })?;

        Ok(Self(uuid))
    }
}

impl ToString for Uuid {
    fn to_string(&self) -> String {
        self.0.to_string()
    }
}

impl CandidType for Uuid {
    fn _ty() -> Type {
        TypeInner::Text.into()
    }

    fn idl_serialize<S>(&self, serializer: S) -> Result<(), S::Error> where S: Serializer {
        self.to_string().idl_serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for Uuid {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error> where D: serde::Deserializer<'de> {
        String::deserialize(deserializer).and_then(|uuid| {
            Uuid::try_from(uuid.as_str()).map_err(|_| serde::de::Error::custom("Invalid UUID."))
        })
    }
}

pub async fn get_uuid() -> String {
    Uuid::new().await.unwrap().to_string()
}
